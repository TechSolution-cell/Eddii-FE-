'use client';

import { getSessionUpdater } from '@/lib/session-updater';
import { signOut } from 'next-auth/react';

export async function apiFetch<T>(
    path: string,
    opts?: RequestInit & { auth?: boolean }
): Promise<T> {
    const normalized = path.startsWith('/') ? path.slice(1) : path;
    const url = `/api/bff/${normalized}`;

    const res = await fetch(url, {
        ...opts,
        headers: { 'Content-Type': 'application/json', ...(opts?.headers || {}) },
    });

    // Persist refreshed tokens (if any)
    const newAccess = res.headers.get('x-refreshed-access-token');
    const newRefresh = res.headers.get('x-refreshed-refresh-token');
    if (newAccess || newRefresh) {
        const updater = getSessionUpdater();
        updater?.({
            ...(newAccess ? { accessToken: newAccess } : {}),
            ...(newRefresh ? { refreshToken: newRefresh } : {}),
        });
    }

    // If session is fully expired (refresh failed), sign out & redirect to login
    const sessionExpired = res.headers.get('x-session-expired') === 'true';
    if (sessionExpired) {
        // fire-and-forget signOut; we will still throw to stop current flow
        signOut({ callbackUrl: '/login' });
    }

    if (!res.ok) {
        // give a stable error code for upstream handlers if needed
        const err = new Error(sessionExpired ? 'SESSION_EXPIRED' : 'Request failed');

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (err as any).code = sessionExpired ? 'SESSION_EXPIRED' : 'REQUEST_FAILED';
        // try to enrich message
        try {
            const data = await res.json();

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (err as any).details = data;
            if (!sessionExpired && data?.message) err.message = data.message;
        } catch {
            // ignore parse errors
        }
        throw err;
    }

    if (res.status === 204) return undefined as unknown as T;
    return res.json() as Promise<T>;
}
