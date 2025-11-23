// /lib/api.ts
'use client';

import { getSession, signOut } from 'next-auth/react';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_API_BASE!;

export class ApiError extends Error {
    code?: string;
    status?: number;
    constructor(message: string, opts?: { code?: string; status?: number }) {
        super(message);
        this.code = opts?.code;
        this.status = opts?.status;
    }
}

/**
 * Ensure we have a valid access token.
 * - NextAuth's jwt() callback will refresh the access token if it's expired
 *   whenever getSession() runs.
 * - If refresh fails (e.g., refresh token expired/invalid), the session will
 *   carry `error: 'RefreshAccessTokenError'`.
 */
async function getValidSessionOrSignOut() {
    const session = await getSession();

    // If NextAuth indicates the refresh failed, we sign out immediately.
    if (session?.error === 'RefreshAccessTokenError') {
        await signOut({ callbackUrl: '/auth/login' });
        throw new ApiError('Session expired. Please sign in again.', {
            code: 'SESSION_EXPIRED',
            status: 401,
        });
    }
    return session;
}

async function doFetch<T>(path: string, opts?: RequestInit & { auth?: boolean }): Promise<T> {
    const url = `${API_BASE}${path}`;
    const res = await fetch(url, opts);

    // If the server returns 204 No Content, return undefined as T (caller must know)
    if (res.status === 204) return undefined as unknown as T;

    if (!res.ok) {
        let message = 'Request failed';
        try {
            // Try to parse json error body; if not JSON, fallback to text
            const ct = res.headers.get('content-type') || '';
            if (ct.includes('application/json')) {
                const data = await res.json();
                message = data?.message || JSON.stringify(data);
            } else {
                message = await res.text();
            }
        } catch {
            /* ignore parse errors */
        }
        throw new ApiError(message || 'Request failed', { status: res.status });
    }

    // parse JSON on success
    return res.json() as Promise<T>;
}

/**
 * apiFetch: authenticated fetch with automatic access token refresh + 401 retry.
 * - Adds Authorization header (unless auth:false)
 * - On 401, re-fetches session (forces refresh) and retries once.
 * - If refresh token is expired/invalid, we sign out and throw `SESSION_EXPIRED`.
 */
export async function apiFetch<T>(
    path: string,
    opts?: RequestInit & { auth?: boolean }
): Promise<T> {
    const auth = opts?.auth !== false;

    // 1) Grab a valid session; this will refresh the access token if needed
    let session = auth ? await getValidSessionOrSignOut() : null;

    // 2) Build headers (normalize to Headers to allow .set)
    const headers = new Headers(opts?.headers as HeadersInit);
    headers.set('Content-Type', 'application/json');
    if (auth) {
        const token = session?.accessToken as string | undefined;
        if (token) headers.set('Authorization', `Bearer ${token}`);
    }

    // 3) First attempt
    try {
        return await doFetch<T>(path, { ...opts, headers });
    } catch (err) {
        const e = err as ApiError;

        // If unauthorized, try one forced refresh & retry once
        if (auth && e.status === 401) {
            // Force a fresh session; if refresh token is dead, this signs out & throws
            session = await getValidSessionOrSignOut();

            const retryHeaders = new Headers(headers);
            const token = session?.accessToken as string | undefined;
            if (token) retryHeaders.set('Authorization', `Bearer ${token}`);

            try {
                return await doFetch<T>(path, { ...opts, headers: retryHeaders });
            } catch (retryErr) {
                const re = retryErr as ApiError;

                // If still unauthorized after retry, assume refresh token is truly invalid/expired.
                if (re.status === 401) {
                    await signOut({ callbackUrl: '/auth/login' });
                    throw new ApiError('Session expired. Please sign in again.', {
                        code: 'SESSION_EXPIRED',
                        status: 401,
                    });
                }
                throw re;
            }
        }
        // Non-401 errors just bubble up
        throw e;
    }
}
