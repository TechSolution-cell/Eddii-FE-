"use client";

// ── React Query ──────────────────────────────────────────────
import {
    keepPreviousData,
    useQuery,
    QueryKey,
    UseQueryResult,
} from "@tanstack/react-query";

// ── App utilities / hooks / state ────────────────────────────
import { apiFetch } from "@/lib/api";

// ── Types & Enums ────────────────────────────────────────────
import {
    DateGrouping,
    DashboardStaticResponse,
    DashboardRangeResponse,
} from "@/types";

// ---- Params -------------------------------------------------

export interface UseDashboardStaticParams {
    marketingSourceIds?: string[];
    timezone?: string;
}

export interface UseDashboardRangeParams {
    from?: string; // ISO date string
    to?: string;   // ISO date string
    marketingSourceIds?: string[];
    groupBy?: DateGrouping;
    timezone?: string;
}

/**
 * Build search params for dashboard endpoints
 */
function buildSearchParams(opts: {
    from?: string;
    to?: string;
    marketingSourceIds?: string[];
    groupBy?: DateGrouping;
    timezone?: string;
}) {
    const { from, to, marketingSourceIds, groupBy, timezone } = opts;

    const sp = new URLSearchParams();

    if (from) sp.set("from", from);
    if (to) sp.set("to", to);

    // backend DTO expects marketingSourceIds as comma-separated list
    if (marketingSourceIds && marketingSourceIds.length > 0) {
        sp.set("marketingSourceIds", marketingSourceIds.join(","));
    }

    if (groupBy) sp.set("groupBy", groupBy);
    if (timezone) sp.set("timezone", timezone);

    return sp.toString();
}

// ---------------------------------------------------------------------
// 1) STATIC DASHBOARD: /dashboard/static
//    Today / Last 7 / Last 30 for Sales & Service
// ---------------------------------------------------------------------
export function useDashboardStatic(
    params: UseDashboardStaticParams,
): UseQueryResult<DashboardStaticResponse> {
    const { marketingSourceIds, timezone } = params;

    const keyPayload = {
        marketingSourceIds: marketingSourceIds ?? [],
        timezone,
    };

    const queryKey: QueryKey = ["dashboard", "static", keyPayload];

    return useQuery<DashboardStaticResponse>({
        queryKey,
        queryFn: async () => {
            // For static endpoint we only send marketingSourceIds + timezone
            const qs = buildSearchParams({ marketingSourceIds, timezone });
            const url = `/dashboard/static${qs ? `?${qs}` : ""}`;

            const res = await apiFetch<DashboardStaticResponse>(url);
            return res;
        },
    });
}

// ---------------------------------------------------------------------
// 2) RANGE DASHBOARD: /dashboard/range
//    Selected range + chart for Sales & Service
// ---------------------------------------------------------------------
export function useDashboardRange(
    params: UseDashboardRangeParams,
): UseQueryResult<DashboardRangeResponse> {
    const { from, to, marketingSourceIds, groupBy, timezone } = params;

    const keyPayload = {
        from,
        to,
        marketingSourceIds: marketingSourceIds ?? [],
        groupBy,
        timezone,
    };

    const queryKey: QueryKey = ["dashboard", "range", keyPayload];

    return useQuery<DashboardRangeResponse>({
        queryKey,
        queryFn: async () => {
            const qs = buildSearchParams({
                from,
                to,
                marketingSourceIds,
                groupBy,
                timezone,
            });
            const url = `/dashboard/range${qs ? `?${qs}` : ""}`;

            const res = await apiFetch<DashboardRangeResponse>(url);
            return res;
        },
        placeholderData: keepPreviousData,
    });
}
