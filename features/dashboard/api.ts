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
import { DateGrouping, DashboardResponse } from "@/types";

export interface UseDashboardParams {
    from?: string;                // ISO date string
    to?: string;                  // ISO date string
    marketingSourceIds?: string[];
    groupBy?: DateGrouping;
    timezone?: string;
}

/**
 * Build search params for dashboard endpoint
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

/**
 * Dashboard data (summary + chart) for a business.
 */
export function useDashboard(
    params: UseDashboardParams
): UseQueryResult<DashboardResponse> {
    const { from, to, marketingSourceIds, groupBy, timezone } = params;

    const keyPayload = {
        from,
        to,
        marketingSourceIds: marketingSourceIds ?? [],
        groupBy,
        timezone,
    };

    const queryKey: QueryKey = ["dashboard", keyPayload];

    return useQuery<DashboardResponse>({
        queryKey,
        queryFn: async () => {
            const qs = buildSearchParams({ from, to, marketingSourceIds, groupBy, timezone });
            const url = `/dashboard${qs ? `?${qs}` : ""}`;
            
            const res = await apiFetch<DashboardResponse>(url);
            return res;
        },
        // placeholderData: keepPreviousData,
    });
}


