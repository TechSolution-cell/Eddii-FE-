'use client';

// ── React & libs ──────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// ── App utilities / hooks / state ────────────────────────────────────
import { cn } from '@/lib/utils';

import {
    useMarketingSources,
} from '@/features/marketing-sources/api';

// ── UI (radix + icons) ───────────────────────────────────────────────
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/Pagination';
import { Edit, Trash2, Plus } from 'lucide-react';
import { TruncText } from '@/components/TruncText';
import { FilterBar } from './components/FilterBar';
import CreateMsDialog from './components/dialogs/CreateMsDialog';
import EditMsDialog from './components/dialogs/EditMsDialog';
import DeleteMsDialog from './components/dialogs/DeleteMsDialog';

// ── Types ─────────────────────────────────────────────────────────────
import type { MarketingSource, Paginated } from '@/types';
import type { Filters } from './components/FilterBar';
type LastAction = 'page' | 'limit' | 'filter' | 'other' | null;

type FiltersWithPagination = Filters & {
    page?: number;
    limit?: number;
};

function useUrlFilters(): [FiltersWithPagination, (f: FiltersWithPagination) => void, () => void] {
    const router = useRouter();
    const sp = useSearchParams();

    const current: FiltersWithPagination = {
        name: sp.get('name') ?? '',
        channel: sp.getAll('channel').length ? sp.getAll('channel') : (sp.get('channel') ?? ''),
        campaignName: sp.get('campaignName') ?? '',

        page: sp.get('page') ? Number(sp.get('page')) : 1,
        limit: sp.get('limit') ? Number(sp.get('limit')) : 25,
    };

    const setFilters = (f: FiltersWithPagination) => {
        const q = new URLSearchParams();
        if (f.name) q.set('name', f.name);
        if (Array.isArray(f.channel)) f.channel.forEach(c => q.append('channel', c));
        else if (f.channel) q.set('channel', f.channel);
        if (f.campaignName) q.set('campaignName', f.campaignName);

        // preserve pagination/sort if you want;
        if (f?.page) q.set('page', String(f.page));
        if (f?.limit) q.set('limit', String(f.limit));

        router.replace(`?${q.toString()}`, { scroll: false });
    };

    const clear = () => router.replace('?', { scroll: false });

    return [current, setFilters, clear];
}

export default function Page() {

    const [lastAction, setLastAction] = useState<LastAction>(null);

    const [filters, setFilters, clearFilters] = useUrlFilters();

    const [currentPage, setCurrentPage] = useState(filters?.page ?? 1);
    const [itemsPerPage, setItemsPerPage] = useState(filters?.limit ?? 25);


    const { data, isLoading, error, isFetching }:
        {
            data: Paginated<MarketingSource> | undefined,
            isLoading: boolean,
            error: Error | null,
            isFetching: boolean
        } = useMarketingSources({
            name: filters.name,
            channel: filters.channel,
            campaignName: filters.campaignName,
            page: currentPage,
            limit: itemsPerPage
            // sortBy, sortOrder, createdFrom/createdTo if needed
        });

    // Reset lastAction when network settles (after the useMarketingSources hook)
    useEffect(() => {
        if (!isFetching) setLastAction(null);
    }, [isFetching]);

    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const [editingMarketingSource, setEditingMarketingSource] = useState<MarketingSource | null>(null);
    const [marketingSourceToDelete, setMarketingSourceToDelete] = useState<MarketingSource | null>(null);


    {/* ── Handlers for Pagination ──────────────────────────────────────────────────────*/ }
    const handlePageChange = (page: number) => {
        setLastAction('page');
        setCurrentPage(page);

        // sync page/limit into filters (and URL)
        setFilters({
            ...filters,
            page,
            limit: itemsPerPage,
        });
    };

    const handleItemsPerPageChange = (newItemsPerPage: number) => {
        setLastAction('limit');
        setItemsPerPage(newItemsPerPage);
        setCurrentPage(1); // Reset to first page when changing items per page

        // sync page/limit into filters (and URL)
        setFilters({
            ...filters,
            page: 1,
            limit: newItemsPerPage,
        });
    };

    const handleSourceCreated = () => {
        // after creating, jump to first page to see the newest record
        setCurrentPage(1);
    }

    {/* ── Handlers for Editing Marketing Source ────────────────────────────────────────*/ }
    const handleEditClick = (ms: MarketingSource) => {
        if (!ms) return;

        setEditingMarketingSource(ms);
        setIsEditDialogOpen(true);
    };

    {/* ── Handlers for Deleting Marketing Source ────────────────────────────────────────*/ }
    const handleDeleteClick = (ms: MarketingSource) => {
        setMarketingSourceToDelete(ms);
        setIsDeleteDialogOpen(true);
    };

    /* Loading flags:
        - shouldShowFullLoader: initial load or filter fetch (hide table)
        - isPaginatingNow: page/limit fetch (keep table, light spinner) */
    const shouldShowFullLoader =
        (isLoading && !data) ||
        (isFetching && (lastAction === 'filter' || (!data && lastAction === null)));

    const isPaginatingNow = isFetching && (lastAction === 'page' || lastAction === 'limit');

    return (
        <>
            <Card className="w-full border-purple-200 border bg-gradient-to-br from-white to-purple-50">
                {/* ── Header ───────────────────────────────────────────────────────────── */}
                <CardHeader className="w-full flex flex-row items-center justify-between bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-t-lg">
                    <div>
                        <CardTitle className="text-2xl text-white">Marketing Sources Management</CardTitle>
                        <CardDescription className='mt-2 mb-5 text-white/80'>Add a new marketing source to manage marketing</CardDescription>
                    </div>
                    <div>
                        <Button
                            onClick={() => { setIsCreateDialogOpen(true) }}
                            className={`bg-purple-500/80 border-gray-300/80 border hover:bg-purple-500
                                 hover:border-gray-200/80 text-white focus-visible: ring-offset-purple-700
                                 focus-visible:ring-gray-300/80 focus-visible:border-0`}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Marketing Source
                        </Button>
                    </div>

                </CardHeader>

                {/* ── List  ────────────────────────────────────────────────────────────────────────── */}
                <CardContent className='mt-3'>
                    <FilterBar
                        defaultValues={filters}
                        isDiabled={isFetching}
                        onChange={(v) => {
                            // reset to page 1 on filter change
                            if (currentPage !== 1) setCurrentPage(1);
                            setLastAction('filter');
                            setFilters(v);
                        }}
                        onClear={() => {
                            setCurrentPage(1);
                            setLastAction('filter');
                            clearFilters();
                        }} />

                    {/* ── Table  ────────────────────────────────────────────────────────────────────────── */}
                    <div className="min-h-0 max-h-[calc(100vh-338px)] pt-5 w-full overflow-y-auto">
                        <div className={cn(
                            "relative transition-opacity duration-200 w-full",
                            isPaginatingNow && [
                                "opacity-50",
                                "pointer-events-none",
                                "blur-[1.5px]",
                                "cursor-not-allowed"
                            ]
                        )}>
                            <Table className='table-fixed w-full min-w-[740px]'>
                                <TableHeader className='sticky top-0 z-10'>
                                    <TableRow className="bg-purple-200 hover:bg-purple-200">
                                        <TableHead className="text-purple-800 font-semibold py-2">Name</TableHead>
                                        <TableHead className="text-purple-800 font-semibold py-2">Channel</TableHead>
                                        <TableHead className="text-purple-800 font-semibold py-2">Campaign Name</TableHead>
                                        <TableHead className="text-purple-800 font-semibold py-2">Description</TableHead>
                                        <TableHead className="text-purple-800 font-semibold py-2">Created</TableHead>
                                        <TableHead className="text-purple-800 font-semibold py-2">Updated</TableHead>
                                        <TableHead className="text-right text-purple-800 font-semibold w-35 py-2">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className='cursor-pointer'>
                                    {!error && data && !shouldShowFullLoader && data.items.map((ms) => (
                                        <TableRow key={ms.id} className="hover:bg-purple-100/50">
                                            <TableCell className="font-medium text-purple-800">
                                                <TruncText value={ms.name} lines={1} className="w-full" />
                                            </TableCell>
                                            <TableCell className="text-purple-600">
                                                <TruncText value={ms?.channel ?? ''} lines={1} className="w-full" />
                                            </TableCell>
                                            <TableCell className="text-purple-600">
                                                <TruncText value={ms?.campaignName ?? ''} lines={1} className="w-full" />
                                            </TableCell>
                                            <TableCell className="text-purple-600">
                                                {/* {ms?.description ? ms.description : '--------'} */}
                                                <TruncText
                                                    value={ms?.description ?? ''}
                                                    lines={3}
                                                    preserveNewlines
                                                    className="w-full"
                                                />
                                            </TableCell>
                                            <TableCell className="text-purple-600">
                                                {ms?.createdAt
                                                    ? new Date(ms.createdAt).toLocaleString(undefined, {
                                                        year: "numeric",
                                                        month: "2-digit",
                                                        day: "2-digit",
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                        hour12: false
                                                    })
                                                    : "-"}
                                            </TableCell>
                                            <TableCell className="text-purple-600">
                                                {ms?.updatedAt
                                                    ? new Date(ms.updatedAt).toLocaleString(undefined, {
                                                        year: "numeric",
                                                        month: "2-digit",
                                                        day: "2-digit",
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                        hour12: false
                                                    })
                                                    : "-"}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        className=" hover:bg-purple-200/60 hover:border-gray-600/50"
                                                        onClick={() => handleEditClick(ms)}
                                                        disabled={isEditDialogOpen}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-red-500 hover:text-red-700 hover:bg-red-200/60 hover:border-gray-600/50"
                                                        onClick={() => handleDeleteClick(ms)}
                                                        disabled={isDeleteDialogOpen}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        {/* <TopLoadingBar isLoading={isPaginatingNow} /> */}
                        {(error || shouldShowFullLoader) ? (
                            <div
                                className={cn(
                                    'text-center py-8 text-lg',
                                    error ? 'text-destructive' : 'text-purple-500'
                                )}
                            >
                                {error ? (
                                    <span className='mt-5'>
                                        Failed to load marketing sources. Please try again.
                                    </span>
                                ) : (
                                    <div role="status" aria-live="polite" className="flex flex-col items-center gap-5">
                                        <span>Loading your marketing sources...</span>
                                        <Spinner
                                            variant="purple-700"
                                            track="purple-200"
                                            label="Loading marketing sources..."
                                        />
                                    </div>
                                )}
                            </div>
                        ) : (
                            data && data?.items.length === 0 ? (
                                <div className="text-center py-8 text-purple-500 mt-5">
                                    No marketing sources found. Create your first marketing source to get started.
                                </div>
                            ) : null
                        )}
                    </div>

                    {/* ── Pagination Control ───────────────────────────────────────────────────────────── */}
                    {!error && data && data?.items.length > 0 && (
                        <Pagination
                            currentPage={currentPage}
                            totalItems={data.meta.total}
                            itemsPerPage={itemsPerPage}
                            onPageChange={handlePageChange}
                            onItemsPerPageChange={handleItemsPerPageChange}
                            isPaginating={isPaginatingNow}
                        />
                    )}
                </CardContent>
            </Card >

            {/* ── Create Dialog  ───────────────────────────────────────────────────────────────────── */}
            < CreateMsDialog
                open={isCreateDialogOpen}
                onCreateSuccess={handleSourceCreated}
                onOpenChange={setIsCreateDialogOpen} />

            {/* ── Edit Dialog ───────────────────────────────────────────────────────────────────────── */}
            < EditMsDialog
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                editingMs={editingMarketingSource} />

            {/* ── Delete Confirmation Dialog ────────────────────────────────────────────────────────── */}
            < DeleteMsDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                msToDelete={marketingSourceToDelete}
            />
            {/* <Toaster /> */}
        </>
    );
}
