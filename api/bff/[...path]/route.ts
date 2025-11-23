import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';

export const runtime = 'nodejs';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE!;

function buildTargetUrl(pathSegs: string[], search: string) {
    const suffix = pathSegs.map(encodeURIComponent).join('/');
    return `${API_BASE.replace(/\/+$/, '')}/${suffix}${search || ''}`;
}

function filterResponseHeaders(h: Headers) {
    const out = new Headers();
    const allowed = [
        'content-type', 'content-length', 'content-disposition',
        'etag', 'last-modified', 'cache-control', 'pragma',
        'expires', 'accept-ranges', 'vary', 'x-powered-by'
    ];
    h.forEach((v, k) => { if (allowed.includes(k.toLowerCase())) out.set(k, v); });
    return out;
}

async function callUpstream(req: NextRequest, target: string, accessToken?: string) {
    const headers = new Headers(req.headers);
    headers.delete('host');
    headers.delete('content-length');
    if (accessToken) headers.set('authorization', `Bearer ${accessToken}`);

    const hasBody = !['GET', 'HEAD'].includes(req.method);
    const init: RequestInit = {
        method: req.method,
        headers,
        body: hasBody ? req.body : undefined,
        // @ts-expect-error: Node streaming flag
        duplex: hasBody ? 'half' : undefined,
    };
    return fetch(target, init);
}

async function proxy(req: NextRequest, ctx: { params: { path: string[] } }) {
    const session = await getServerSession(authOptions);
    const accessToken = (session as any)?.accessToken as string | undefined;
    const refreshToken = (session as any)?.refreshToken as string | undefined;

    const target = buildTargetUrl(ctx.params.path, req.nextUrl.search);

    // 1) Attempt with current access token
    let upstream = await callUpstream(req, target, accessToken);

    // Flags for downstream client
    let rotatedAccess: string | undefined;
    let rotatedRefresh: string | undefined;
    let sessionExpired = false; // <-- set true when refresh failed

    // 2) On 401, try to refresh & retry once
    if (upstream.status === 401 && refreshToken) {
        try {
            const refreshRes = await fetch(`${API_BASE.replace(/\/+$/, '')}/auth/refresh`, {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ refreshToken }),
            });

            if (refreshRes.ok) {
                const data = await refreshRes.json(); // { access_token, refresh_token }
                rotatedAccess = data?.access_token;
                rotatedRefresh = data?.refresh_token ?? refreshToken;

                if (rotatedAccess) {
                    upstream = await callUpstream(req, target, rotatedAccess);
                } else {
                    // Refresh endpoint responded OK but didn’t return a token (treat as expired)
                    sessionExpired = true;
                }
            } else {
                // Refresh endpoint said no (expired/revoked)
                sessionExpired = true;
            }
        } catch {
            // Network failure while refreshing -> treat as expired from client perspective
            sessionExpired = true;
        }
    }

    // 3) Build response & annotate with headers
    const headers = filterResponseHeaders(upstream.headers);
    const res = new NextResponse(upstream.body, {
        status: upstream.status,
        statusText: upstream.statusText,
        headers,
    });

    // If we refreshed, bubble up tokens
    if (rotatedAccess) res.headers.set('x-refreshed-access-token', rotatedAccess);
    if (rotatedRefresh) res.headers.set('x-refreshed-refresh-token', rotatedRefresh);

    // If refresh failed AND upstream is still 401, tell the client it's a dead session
    if (sessionExpired && upstream.status === 401) {
        res.headers.set('x-session-expired', 'true');
        // Optional: nicer error body if the upstream returned html/plaintext
        // (We can’t safely replace the body stream here; header is enough)
    }

    return res;
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const PUT = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
