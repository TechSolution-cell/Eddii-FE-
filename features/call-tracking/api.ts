"use client"

// ── React & libs ──────────────────────────────────────────────
// React Query: data fetching, caching, mutations, and helpers
import {
    keepPreviousData,
    useMutation,
    useQuery,
    useQueryClient,
    QueryKey
} from '@tanstack/react-query';
import { UseQueryResult } from '@tanstack/react-query';

// ── App utilities / hooks / state ────────────────────────────────────
import { apiFetch } from '@/lib/api';

// ── Types ───────────────────────────────────────────────────────────
// Domain models and data contracts
import { TrackingNumber, Paginated, AvailableNumber, SortOrder, TrackingNumberSortBy } from '@/types';

export type UseTrackingNumbersParams = {
    number?: string | null;
    forwardingVoiceNumber?: string | null;
    marketingSourceId?: string | null;
    createdFrom?: string | null; // ISO date string
    createdTo?: string | null;   // ISO date string
    sortBy?: TrackingNumberSortBy | null;
    sortOrder?: SortOrder | null;
    page?: number | null;
    limit?: number | null;
};

function buildSearchParams(opts: Required<Pick<UseTrackingNumbersParams,
    'page' | 'limit' | 'sortOrder'>> &
    Omit<UseTrackingNumbersParams, 'page' | 'limit' | 'sortOrder'>
) {
    const {
        page, limit, sortBy, sortOrder,
        number, forwardingVoiceNumber, marketingSourceId, createdFrom, createdTo
    } = opts;

    const sp = new URLSearchParams();

    sp.set('page', String(page));
    sp.set('limit', String(limit));
    if (sortOrder) sp.set('sortOrder', sortOrder);
    if (sortBy) sp.set('sortBy', sortBy);

    if (number) sp.set('number', number);
    if (forwardingVoiceNumber) sp.set('forwardingVoiceNumber', forwardingVoiceNumber);
    if (marketingSourceId) sp.set('marketingSourceId', marketingSourceId);
    if (createdFrom) sp.set('createdFrom', createdFrom);
    if (createdTo) sp.set('createdTo', createdTo);

    return sp.toString();
}

export function useTrackingNumbers(params: UseTrackingNumbersParams = {}): UseQueryResult<Paginated<TrackingNumber>, Error> {

    const {
        page = 1,
        limit = 25,
        sortBy,
        sortOrder = 'DESC',
        number,
        forwardingVoiceNumber,
        marketingSourceId,
        createdFrom,
        createdTo,
    } = params;

    const keyPayload = {
        page,
        limit,
        sortBy: sortBy ?? null,
        sortOrder,
        number: number ?? null,
        forwardingVoiceNumber: forwardingVoiceNumber ?? null,
        marketingSourceId: marketingSourceId ?? null,
        createdFrom: createdFrom ?? null,
        createdTo: createdTo ?? null,
    };

    const queryKey: QueryKey = ['businesses', keyPayload];

    return useQuery({
        queryKey: ["tracking-numbers", queryKey],
        queryFn: async () => {
            const qs = buildSearchParams({
                page, limit, sortBy, sortOrder, number, forwardingVoiceNumber, marketingSourceId, createdFrom, createdTo,
            });

            const res = await apiFetch<Paginated<TrackingNumber>>(`/call-tracking/tracking-numbers?${qs}`);
            return res;
        },
        placeholderData: keepPreviousData,
    });
}

export function useAvailableNumbers({ country = 'US', areaCode, limit = 10 }: { country?: string, areaCode: string, limit?: number }) {
    return useQuery({
        queryKey: ["availableNumbers", country, areaCode, limit],
        queryFn: async (): Promise<AvailableNumber[]> => {
            if (!areaCode || areaCode.length !== 3) return [];
            const res = await apiFetch<AvailableNumber[]>(`/call-tracking/available-numbers?country=${country}&areaCode=${areaCode}&limit=${limit}`);
            return res;
        },
        enabled: !!areaCode && areaCode.length === 3
    });
}

export function useProvisionTrackingNumber() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: {
            trackingNumber: string;
            forwardingVoiceNumber?: string;
            marketingSourceId?: string;
            country?: string,
            areaCode?: string;
            friendlyName?: string;
        }) => {
            return apiFetch('/call-tracking/tracking-numbers/provision', { method: 'POST', body: JSON.stringify(payload) });
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["tracking-numbers"] });
        },
    });
}

export function useUpdateTrackingNumber() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: {
            id: string;
            forwardingVoiceNumber?: string | null;
            marketingSourceId?: string | null;
        }) => {
            const { id, ...updateFields } = payload;
            return apiFetch(`/call-tracking/tracking-numbers/${id}`,
                { method: 'PATCH', body: JSON.stringify(updateFields) });
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["tracking-numbers"] });
        },
    });
}

type DeleteResponse = { deleted: boolean; reason?: string };

export function useDeleteTrackingNumber() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string): Promise<DeleteResponse> => {
            const res = await apiFetch(`/call-tracking/tracking-numbers/${id}`, { method: 'DELETE' });
            return res as DeleteResponse;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["tracking-numbers"] });
        },
    });
}