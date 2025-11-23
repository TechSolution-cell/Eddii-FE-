import "next-auth";
import type { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
    interface Session {
        accessToken?: string;
        error?: "RefreshAccessTokenError" | string;
        user: DefaultSession["user"] & {
            id: string;
            name?: string | null;
            email?: string | null;
            role?: string | null;
            // business?: {
            //     id: string,
            //     email: string,
            //     businessName: string
            // }
            [k: string]: unknown;
        };
    }

    interface User extends DefaultUser {
        id: string,
        name?: string | null;
        email?: string | null;
        role?: string | null;
        accessToken?: string;
        refreshToken?: string;
        accessTokenExpires?: number;
        // business?: {
        //     id: string,
        //     email: string,
        //     businessName: string
        // }
        [k: string]: unknown;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        user?: {
            id: string
            name?: string | null
            email?: string | null
            role?: string | null
            // roles?: string[]
            // business?: {
            //     id: string,
            //     email: string,
            //     businessName: string
            // }
        };
        accessToken?: string;
        refreshToken?: string;
        accessTokenExpires?: number;
        
        error?: "RefreshAccessTokenError" | string;
    }
}

export { };