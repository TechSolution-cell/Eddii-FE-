"use client"

// ── React & libs ──────────────────────────────────────────────
// React Query: data fetching, caching, mutations, and helpers
import { keepPreviousData, QueryKey, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// ── App utilities / hooks / state ────────────────────────────────────
import { apiFetch } from '@/lib/api';

// ── Types & Enums ───────────────────────────────────────────────────────────
import { Paginated, CallLog, CallLogSortBy, SortOrder } from '@/types';

export interface UseCallLogsParams {
    marketingSourceId?: string;
    startedFrom?: string; // ISO date string
    startedTo?: string;   // ISO date string
    sortBy?: CallLogSortBy;
    sortOrder?: SortOrder;
    page?: number;
    limit?: number;
};

export interface UseRecordingUrlParams {
    callLogId: string;
}

export interface RecordingUrlResponse {
    url: string;
}

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

    if (marketingSourceId) sp.set('marketingSourceId', marketingSourceId);

    if(startedFrom) sp.set('startedFrom', startedFrom);
    if(startedTo) sp.set('startedTo', startedTo);

    if (page) sp.set('page', String(page));
    if (limit) sp.set('limit', String(limit));

    if (sortOrder) sp.set('sortOrder', sortOrder);
    if (sortBy) sp.set('sortBy', sortBy);

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

/**
 * Recording Url
*/

export function useRecordingUrl(params: UseRecordingUrlParams) {
    const id = params.callLogId;
    const queryKey: QueryKey = ['call-recording', id];

    return useQuery({
        queryKey,
        queryFn: async (): Promise<RecordingUrlResponse> => {
            const res = await apiFetch<RecordingUrlResponse>(`/call-logs/${id}/recording`);
            return res;
        },
        staleTime: 25 * 60 * 1000,
        gcTime: 25 * 60 * 1000
    });
}