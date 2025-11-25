
// ── React & libs ──────────────────────────────────────────────
// React Query: data fetching, caching, mutations, and helpers
import { keepPreviousData, QueryKey, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UseQueryResult } from '@tanstack/react-query';

// ── App utilities / hooks / state ────────────────────────────────────
import { apiFetch } from '@/lib/api';

// ── Types ───────────────────────────────────────────────────────────
// Domain models and data contracts
import { MarketingSource, Paginated, SortOrder, MarketingSourceSortBy} from '@/types';


export type UseMarketingSourcesParams = {
    term?: string;
    name?: string;
    channel?: string | string[];
    campaignName?: string;
    createdFrom?: string; // ISO date string
    createdTo?: string;   // ISO date string
    sortBy?: MarketingSourceSortBy;
    sortOrder?: SortOrder;
    page?: number;
    limit?: number;
    enabled?: boolean; // optional toggle for external control
};

function buildSearchParams(opts: Required<Pick<UseMarketingSourcesParams,
    'page' | 'limit' | 'sortOrder'>> &
    Omit<UseMarketingSourcesParams, 'page' | 'limit' | 'sortOrder'>
) {
    const {
        page, limit, sortBy, sortOrder,
        term, name, channel, campaignName, createdFrom, createdTo,
    } = opts;

    const sp = new URLSearchParams();

    sp.set('page', String(page));
    sp.set('limit', String(limit));
    sp.set('sortOrder', sortOrder);

    if (sortBy) sp.set('sortBy', sortBy);
    if (term) sp.set('term', term);
    if (name) sp.set('name', name);
    if (campaignName) sp.set('campaignName', campaignName);
    if (createdFrom) sp.set('createdFrom', createdFrom);
    if (createdTo) sp.set('createdTo', createdTo);

    if (Array.isArray(channel)) {
        channel.forEach(ch => sp.append('channel', ch));
    } else if (channel) {
        sp.set('channel', channel);
    }

    return sp.toString();
}

/**
 * Paginated Marketing Sources
 */
export function useMarketingSources(
    params: UseMarketingSourcesParams = {}): UseQueryResult<Paginated<MarketingSource>, Error> {
    const {
        page = 1,
        limit = 25,
        sortBy,
        sortOrder = 'DESC',
        term,
        name,
        channel,
        campaignName,
        createdFrom,
        createdTo,
    } = params;

    // build queryKey payload (normalize channel)
    const keyPayload = {
        page,
        limit,
        sortBy: sortBy ?? null,
        sortOrder,
        term: term ?? null,
        name: name ?? null,
        channel: Array.isArray(channel) ? [...channel].sort() : (channel ?? null),
        campaignName: campaignName ?? null,
        createdFrom: createdFrom ?? null,
        createdTo: createdTo ?? null,
    };

    const queryKey: QueryKey = ['marketing-sources', keyPayload];

    return useQuery<Paginated<MarketingSource>>({
        queryKey,
        queryFn: async () => {
            const qs = buildSearchParams({
                page, limit, sortBy, sortOrder, term, name, channel, campaignName, createdFrom, createdTo,
            });
            const res = await apiFetch<Paginated<MarketingSource>>(`/marketing-sources?${qs}`);
            return res;
        },
        placeholderData: keepPreviousData,
        // staleTime: 30_000,
        refetchOnWindowFocus: false,
    });
}

export function useCreateMarketingSource() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: Partial<MarketingSource>) =>
            apiFetch<MarketingSource>('/marketing-sources', { method: 'POST', body: JSON.stringify(payload) }),

        // optimistic:
        // onMutate: async (payload) => {
        //     await qc.cancelQueries({ queryKey: ['marketing-sources'] });
        //     const prev = qc.getQueryData<MarketingSource[]>(['marketing-sources']) || [];
        //     const temp: MarketingSource = {
        //         id: `temp-${Date.now()}`,
        //         name: payload.name || 'New Source',
        //         description: payload.description,
        //         channel: payload.channel,
        //         campaignName: payload.campaignName,
        //     };
        //     qc.setQueryData<MarketingSource[]>(['marketing-sources'], [temp, ...prev]);
        //     return { prev };
        // },
        // onError: (_err, _payload, ctx) => {
        //     if (ctx?.prev) qc.setQueryData(['marketing-sources'], ctx.prev);
        // },
        // onSettled: () => {
        //     qc.invalidateQueries({ queryKey: ['marketing-sources'] });
        // },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['marketing-sources'] });
        },
    });
}

export function useUpdateMarketingSource() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (args: { id: string; payload: Partial<MarketingSource> }) =>
            apiFetch<MarketingSource>(`/marketing-sources/${args.id}`, {
                method: 'PATCH',
                body: JSON.stringify(args.payload),
            }),
        // onMutate: async ({ id, payload }) => {
        //     await qc.cancelQueries({ queryKey: ['marketing-sources'] });
        //     const prev = qc.getQueryData<MarketingSource[]>(['marketing-sources']) || [];
        //     qc.setQueryData<MarketingSource[]>(['marketing-sources'], prev.map(ms =>
        //         ms.id === id ? { ...ms, ...payload } as MarketingSource : ms
        //     ));
        //     return { prev };
        // },
        // onError: (_err, _vars, ctx) => { if (ctx?.prev) qc.setQueryData(['marketing-sources'], ctx.prev); },
        // onSettled: () => { qc.invalidateQueries({ queryKey: ['marketing-sources'] }); },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['marketing-sources'] });
        },
    });
}

export function useDeleteMarketingSource() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => apiFetch(`/marketing-sources/${id}`, { method: 'DELETE' }),
        // onMutate: async (id) => {
        //     await qc.cancelQueries({ queryKey: ['marketing-sources'] });
        //     const prev = qc.getQueryData<MarketingSource[]>(['marketing-sources']) || [];
        //     qc.setQueryData<MarketingSource[]>(['marketing-sources'], prev.filter(ms => ms.id !== id));
        //     return { prev };
        // },
        // onError: (_err, _id, ctx) => { if (ctx?.prev) qc.setQueryData(['marketing-sources'], ctx.prev); },
        // onSettled: () => { qc.invalidateQueries({ queryKey: ['marketing-sources'] }); },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['marketing-sources'] });
        },
    });
}
