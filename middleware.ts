import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server";

import type { Role } from "./types";

// const INITIAL_ROUTE = "/home";

const SUPER_ADMIN_INITIAL_ROUTE = "/businesses";
const BUSINESS_ADMIN_INITIAL_ROUTE = "/home";

function getInitialRoute(userRoles: Role[]) {
    // If user has SUPER_ADMIN, send them to /businesses
    if (userRoles.includes("SUPER_ADMIN")) {
        return SUPER_ADMIN_INITIAL_ROUTE;
    }

    // Default for others (e.g. BUSINESS_ADMIN)
    return BUSINESS_ADMIN_INITIAL_ROUTE;
}

const RBAC: Array<{ pattern: RegExp; roles: Role[] }> = [
    { pattern: /^\/home(?:\/.*)?$/i, roles: ["BUSINESS_ADMIN"] },

    { pattern: /^\/businesses(?:\/.*)?$/i, roles: ["SUPER_ADMIN"] },

    { pattern: /^\/calls(?:\/.*)?$/i, roles: ["BUSINESS_ADMIN"] },

    { pattern: /^\/marketing-sources(?:\/.*)?$/i, roles: ["BUSINESS_ADMIN"] },

    { pattern: /^\/call-flows(?:\/.*)?$/i, roles: ["BUSINESS_ADMIN"] },

];

function getUserRoles(token: any): Role[] {
    const roles = (token?.user?.roles ?? (token?.user?.role ? [token.user.role] : [])) as string[];
    return roles.filter(Boolean) as Role[];
}

function isProtectedPath(pathname: string) {
    return RBAC.some((r) => r.pattern.test(pathname));
}

function isAllowed(pathname: string, userRoles: Role[]) {
    const rule = RBAC.find((r) => r.pattern.test(pathname));
    if (!rule) return true; // no rule -> not protected
    return userRoles.some((r) => rule.roles.includes(r));
}

export default withAuth(function middleware(req) {
    const { token } = req.nextauth;
    const url = req.nextUrl;

    const roles = token ? getUserRoles(token) : [];

    // If the user is signed in and tries to visit the login page, send them to INITIAL_ROUTE
    if (token && url.pathname === "/auth/login") {
        url.pathname = getInitialRoute(roles);
        return NextResponse.redirect(url);
    }

    // Set initial route:
    // - Visiting "/" sends authed users to INITIAL_ROUTE
    // - Visiting "/" sends unauthenticated users to the login page
    if (url.pathname === "/") {
        url.pathname = token ? getInitialRoute(roles) : "/auth/login";
        return NextResponse.redirect(url);
    }

    // Optional: normalize SUPER_ADMIN hitting "/home" (e.g. from callbackUrl)
    if (token && roles.includes("SUPER_ADMIN") && url.pathname === "/home") {
        url.pathname = "/businesses";
        return NextResponse.redirect(url);
    }

    if (token && isProtectedPath(url.pathname)) {
        const roles = getUserRoles(token);

        if (!isAllowed(url.pathname, roles)) {
            // Not authorized -> 403 page (create /403 route)
            const deny = new URL("/403", req.url);
            // Or, redirect somewhere else:
            // const deny = new URL(INITIAL_ROUTE + "?unauthorized=1", req.url);
            return NextResponse.redirect(deny);
        }
    }
    return NextResponse.next();
}, {

    callbacks: {
        authorized: ({ token }) => !!token && !(token as any).error,
    },
    pages: {
        signIn: "/auth/login",
    },
})

export const config = {
    matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
}







