import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server";


import type { Role } from "./types";
const INITIAL_ROUTE = "/home";

const RBAC: Array<{ pattern: RegExp; roles: Role[] }> = [
    { pattern: /^\/home(?:\/.*)?$/i, roles: ["SUPER_ADMIN", "BUSINESS_ADMIN"] },

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

    // If the user is signed in and tries to visit the login page, send them to INITIAL_ROUTE
    if (token && url.pathname === "/auth/login") {
        url.pathname = INITIAL_ROUTE;
        return NextResponse.redirect(url);
    }

    // Set initial route:
    // - Visiting "/" sends authed users to INITIAL_ROUTE
    // - Visiting "/" sends unauthenticated users to the login page
    if (url.pathname === "/") {
        url.pathname = token ? INITIAL_ROUTE : "/auth/login";
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







