/* eslint-disable @typescript-eslint/no-explicit-any */

import CredentialsProvider from "next-auth/providers/credentials"
import type { Account, NextAuthOptions } from "next-auth"
import type { AdapterUser } from "next-auth/adapters"
import { JWT } from "next-auth/jwt"
import { Session, User } from "next-auth"
import { jwtDecode } from "jwt-decode";


type JwtPayload = {
    sub?: string;
    name?: string;
    email?: string;
    role?: string;
    exp?: number;
    [k: string]: unknown
};

const API_BASE = process.env.BACKEND_API_BASE_URL!

async function refreshAccessToken(token: JWT): Promise<JWT> {
    try {
        console.log('refresh access token');
        const res = await fetch(`${API_BASE}/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh_token: token.refreshToken }),
        });
        console.log(res);
        if (!res.ok) throw new Error("Refresh failed")

        const refreshed = await res.json()
        const decoded = jwtDecode<JwtPayload>(refreshed.access_token);
        const accessTokenExpires = decoded?.exp ? decoded.exp * 1000 : Date.now() + 14 * 60 * 1000; // Default 14 mins
        
        return {
            ...token,
            accessToken: refreshed.access_token,
            accessTokenExpires,
            refreshToken: refreshed.refresh_token ?? token.refreshToken,
        }
    } catch (e: unknown) {
        console.log(e);
        // console.log(e instanceof Error ? e.message : e)
        console.log('RefreshAccessTokenError');
        return { ...token, error: "RefreshAccessTokenError" }
    }
}

// -- normalize checkbox/boolean-ish value coming from credentials
function parseRemember(v: unknown): boolean {
    if (typeof v === 'boolean') return v;
    if (typeof v === 'string') {
        const s = v.trim().toLowerCase();
        return s === 'true' || s === 'on' || s === '1' || s === 'yes';
    }
    return false;
}


export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" },
                rememberMe: { label: "RememberMe", type: "checkbox" }
            },
            async authorize(credentials): Promise<User | null> {
                if (!credentials?.email || !credentials?.password) return null;
                const rememberMe = parseRemember(credentials.rememberMe);
                try {
                    const res = await fetch(`${API_BASE}/auth/login`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            email: credentials.email,
                            password: credentials.password,
                            rememberMe: rememberMe
                        }),
                    })

                    if (!res.ok) return null
                    const data = await res.json()

                    const decoded = jwtDecode<JwtPayload>(data.access_token);
                    const accessTokenExpires = decoded?.exp ? decoded.exp * 1000 : Date.now() + 14 * 60 * 1000; // Default 14 mins

                    return {
                        id: (decoded?.sub as string) ?? "",
                        name: decoded?.name ?? "",
                        email: decoded?.email ?? "",
                        role: decoded?.role ?? "",
                        accessToken: data?.access_token ?? '',
                        refreshToken: data?.refresh_token ?? '',
                        accessTokenExpires,
                        // business: data?.business ?? null
                        // rememberMe, // keep for reference
                    } as User;
                } catch (err: any) {
                    console.error("[authorize] error:", err?.name, err?.message);
                    return null;
                }
            },
        }),
    ],
    secret: process.env.NEXTAUTH_SECRET,
    session: {
        strategy: "jwt",
        // Max session age; token refresh kicks in through the jwt() callback below.
        maxAge: 30 * 24 * 60 * 60,
        updateAge: 24 * 60 * 60
    },
    callbacks: {
        async jwt({ token, user }: {
            token: JWT;
            user?: User | AdapterUser;
            account?: Account | null;
            trigger?: "signIn" | "signUp" | "update";
            session?: any
        }): Promise<JWT> {
            // On sign in
            if (user) {
                token.user = {
                    // id: (user as any).id,
                    id: (user as User).id,
                    name: user.name,
                    email: user.email,
                    role: (user as any).role,
                    // business: user.business
                }
                token.accessToken = (user as any).accessToken
                token.refreshToken = (user as any).refreshToken
                token.accessTokenExpires = (user as any).accessTokenExpires
                return token
            }

            // allow client-triggered updates to persist refreshed tokens
            // if (trigger === 'update' && session) {
            //     const s = session as any;
            //     if (s.accessToken) token.accessToken = s.accessToken;
            //     if (s.refreshToken) token.refreshToken = s.refreshToken;

            //     token.accessTokenExpires = Date.now() + 14 * 60 * 1000;
            //     return token;
            // }

            // If token still valid, return it
            if (token.accessToken && typeof token.accessTokenExpires === "number" && Date.now() < token.accessTokenExpires) {
                console.log('access token is not expired: (callback jwt)', Date.now());
                return token;
            }
            // Refresh otherwise
            return refreshAccessToken(token)
        },
        async session({ session, token }): Promise<Session> {
            session.user = token.user as any
            session.accessToken = token.accessToken as string
            session.error = token.error
            return session

            // (session as any).accessToken = token.accessToken;
            // (session as any).refreshToken = token.refreshToken;
            // (session as any).rememberMe = token.rememberMe ?? false;
            // (session as any).error = token.error;
        },
    },
}
