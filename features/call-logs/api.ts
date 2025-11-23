"use client"

// ── React & libs ──────────────────────────────────────────────
// React Query: data fetching, caching, mutations, and helpers
import { keepPreviousData, QueryKey, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// ── App utilities / hooks / state ────────────────────────────────────
import { apiFetch } from '@/lib/api';

// ── Types & Enums ───────────────────────────────────────────────────────────
import { Paginated, CallLog, CallLogSortBy, SortOrder } from '@/types';

export type UseCallLogsParams = {
    marketingSourceId?: string;
    startedFrom?: string; // ISO date string
    startedTo?: string;   // ISO date string
    sortBy?: CallLogSortBy;
    sortOrder?: SortOrder;
    page?: number;
    limit?: number;
};


/**
 * Build search params
 */
function buildSearchParams(opts: Required<Pick<UseCallLogsParams,
    'page' | 'limit' | 'sortOrder'>> &
    Omit<UseCallLogsParams, 'page' | 'limit' | 'sortOrder'>
) {
    const {
        page, limit, sortBy, sortOrder, startedFrom,
        startedTo, marketingSourceId
    } = opts;

    const sp = new URLSearchParams();

    sp.set('page', String(page));
    sp.set('limit', String(limit));
    sp.set('sortOrder', sortOrder);

    if (sortBy) sp.set('sortBy', sortBy);
    if (marketingSourceId) sp.set('marketingSourceId', marketingSourceId);

    return sp.toString();
}


/**
 * Paginated Call Logs
 */
export function useCallLogs(params: UseCallLogsParams = {}) {
    const {
        page = 1,
        limit = 25,
        sortBy = 'callStartedAt',
        sortOrder = 'DESC',
        marketingSourceId,
        startedFrom,
        startedTo
    } = params;

    // build queryKey payload (normalize channel)
    const keyPayload = {
        page,
        limit,
        sortBy: sortBy ?? null,
        sortOrder,
        marketingSourceId: marketingSourceId ?? null,
        startedFrom: startedFrom ?? null,
        startedTo: startedTo ?? null,
    };

    const queryKey: QueryKey = ['call-logs', keyPayload];
    return useQuery({
        queryKey,
        queryFn: async (): Promise<Paginated<CallLog>> => {
            const qs = buildSearchParams({
                page, limit, sortBy, sortOrder, marketingSourceId, startedFrom, startedTo,
            });
            const res = await apiFetch<Paginated<CallLog>>(`/call-logs?${qs}`);
            return res;
        },
    });
}