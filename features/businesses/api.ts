
// ── React & libs ──────────────────────────────────────────────
// React Query: data fetching, caching, mutations, and helpers
import {
    useMutation,
    useQuery,
    useQueryClient,
    keepPreviousData,
    QueryKey
} from '@tanstack/react-query';
import { UseQueryResult } from '@tanstack/react-query';

// ── App utilities / hooks / state ────────────────────────────────────
import { apiFetch } from '@/lib/api';

// ── Types ───────────────────────────────────────────────────────────
// Domain models and data contracts
import type { Business, Paginated, SortOrder, BusinessSortBy } from '@/types';


export type UseBusinessesParams = {
    name?: string | null;
    email?: string | null;
    createdFrom?: string | null; // ISO date string
    createdTo?: string | null;   // ISO date string
    sortBy?: BusinessSortBy | null;
    sortOrder?: SortOrder | null;
    page?: number | null;
    limit?: number | null;
};

function buildSearchParams(opts: Required<Pick<UseBusinessesParams,
    'page' | 'limit' | 'sortOrder'>> &
    Omit<UseBusinessesParams, 'page' | 'limit' | 'sortOrder'>
) {
    const {
        page, limit, sortBy, sortOrder,
        name, email, createdFrom, createdTo
    } = opts;

    const sp = new URLSearchParams();

    sp.set('page', String(page));
    sp.set('limit', String(limit));
    if (sortOrder) sp.set('sortOrder', sortOrder);
    if (sortBy) sp.set('sortBy', sortBy);

    if (name) sp.set('name', name);
    if (email) sp.set('email', email);
    if (createdFrom) sp.set('createdFrom', createdFrom);
    if (createdTo) sp.set('createdTo', createdTo);

    return sp.toString();
}

export function useBusinesses(params: UseBusinessesParams = {}): UseQueryResult<Paginated<Business>, Error> {
    const {
        page = 1,
        limit = 25,
        sortBy,
        sortOrder = 'DESC',
        name,
        email,
        createdFrom,
        createdTo,
    } = params;

    const keyPayload = {
        page,
        limit,
        sortBy: sortBy ?? null,
        sortOrder,
        name: name ?? null,
        email: email ?? null,
        createdFrom: createdFrom ?? null,
        createdTo: createdTo ?? null,
    };

    const queryKey: QueryKey = ['businesses', keyPayload];

    return useQuery({
        queryKey: ['businesses', queryKey],
        queryFn: async () => {
            const qs = buildSearchParams({
                page, limit, sortBy, sortOrder, name, email, createdFrom, createdTo,
            });
            const res = await apiFetch<Paginated<Business>>(`/businesses?${qs}`);

            return res;
        },
        placeholderData: keepPreviousData,
    });
}

export function useCreateBusiness() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: {
            email: string;
            password: string;
            businessName: string;
        }) =>
            apiFetch<Business>('/businesses', {
                method: 'POST',
                body: JSON.stringify(payload),
            }),
        // optimistic
        // onMutate: async (payload) => {
        //     await qc.cancelQueries({ queryKey: ['businesses'] });
        //     const prev = qc.getQueryData<Business[]>(['businesses']) || [];
        //     const temp: Business = {
        //         id: `temp-${Date.now()}`,
        //         email: payload.email,
        //         businessName: payload.businessName,
        //         createdAt: new Date().toISOString(),
        //         updatedAt: new Date().toISOString(),
        //     };
        //     qc.setQueryData<Business[]>(['businesses'], [temp, ...prev]);
        //     return { prev };
        // },
        // onError: (_e, _v, ctx) => {
        //     if (ctx?.prev) qc.setQueryData(['businesses'], ctx.prev);
        // },
        // onSettled: () => {
        //     qc.invalidateQueries({ queryKey: ['businesses'] });
        // },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['businesses'] });
        },
    });
}

export function useUpdateBusiness() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (args: {
            id: string;
            payload: Partial<{
                email: string;
                password: string;
                businessName: string;
                maxTrackingNumbers: number;
            }>;
        }) =>
            apiFetch<Business>(`/businesses/${args.id}`, {
                method: 'PATCH',
                body: JSON.stringify(args.payload),
            }),
        onMutate: async ({ id, payload }) => {
            await qc.cancelQueries({ queryKey: ['businesses'] });
            const prev = qc.getQueryData<Business[]>(['businesses']) || [];
            qc.setQueryData<Business[]>(
                ['businesses'],
                prev.map((b) => (b.id === id ? { ...b, ...payload, updatedAt: new Date().toISOString() } : b)),
            );
            return { prev };
        },
        onError: (_e, _v, ctx) => {
            if (ctx?.prev) qc.setQueryData(['businesses'], ctx.prev);
        },
        onSettled: () => {
            qc.invalidateQueries({ queryKey: ['businesses'] });
        },
    });
}

export function useDeleteBusiness() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => apiFetch(`/businesses/${id}`, { method: 'DELETE' }),
        // onMutate: async (id) => {
        //     await qc.cancelQueries({ queryKey: ['businesses'] });
        //     const prev = qc.getQueryData<Business[]>(['businesses']) || [];
        //     qc.setQueryData<Business[]>(['businesses'], prev.filter((b) => b.id !== id));
        //     return { prev };
        // },
        // onError: (_e, _v, ctx) => {
        //     if (ctx?.prev) qc.setQueryData(['businesses'], ctx.prev);
        // },
        // onSettled: () => {
        //     qc.invalidateQueries({ queryKey: ['businesses'] });
        // },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['businesses'] }),
    });
}
