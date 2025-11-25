'use client';

// ── React & libs ──────────────────────────────────────────────────────
import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// ── App utilities / hooks / state ────────────────────────────────────
import {
  useTrackingNumbers,
} from '@/features/call-tracking/api';
import { cn, fmt } from '@/lib/utils';

// ── UI (radix + icons) ───────────────────────────────────────────────
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Pagination } from '@/components/Pagination';
import { TruncText } from '@/components/TruncText';
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Phone, Trash2, Plus, Edit, PhoneForwarded } from 'lucide-react';

import { CreateTrackingNumberDialog } from './components/dialogs/CreateTrackingNumberDialog';
import { EditTrackingNumberDialog } from './components/dialogs/EditTrackingNumberDialog';
import { DeleteTrackingNumberDialog } from './components/dialogs/DeleteTrackingNumberDialog';
import { FilterBar, Filters } from './components/FilterBar';

// ── Types ─────────────────────────────────────────────────────────────
import type { Paginated, TrackingNumber } from '@/types';

type FiltersWithPagination = Filters & {
  page?: number;
  limit?: number;
};

type LastAction = 'page' | 'limit' | 'filter' | 'other' | null;

function useUrlFilters(): [FiltersWithPagination, (f: FiltersWithPagination) => void, () => void] {
  const router = useRouter();
  const sp = useSearchParams();

  const current: FiltersWithPagination = {
    number: sp.get('number') ?? '',
    forwardingVoiceNumber: sp.get('forwardingVoiceNumber') ?? '',
    marketingSourceId: sp.get('marketingSourceId') ?? '',

    page: sp.get('page') ? Number(sp.get('page')) : 1,
    limit: sp.get('limit') ? Number(sp.get('limit')) : 25,
  };

  const setFilters = (f: FiltersWithPagination) => {
    const q = new URLSearchParams();
    if (f.number) q.set('number', f.number);
    if (f.forwardingVoiceNumber) q.set('forwardingVoiceNumber', f.forwardingVoiceNumber);
    if (f.marketingSourceId) q.set('marketingSourceId', f.marketingSourceId);

    // pagination
    if (f?.page) q.set('page', String(f.page));
    if (f?.limit) q.set('limit', String(f.limit));

    router.replace(`?${q.toString()}`, { scroll: false });
  };

  const clear = () => router.replace('?', { scroll: false });

  return [current, setFilters, clear];
}

const Page = () => {

  const [lastAction, setLastAction] = useState<LastAction>(null);
  const [filters, setFilters, clearFilters] = useUrlFilters();

  {/** Pagination */ }
  const [currentPage, setCurrentPage] = useState(filters?.page ?? 1);
  const [itemsPerPage, setItemsPerPage] = useState(filters?.limit ?? 25);

  const { data, isLoading, error, isFetching }:
    {
      data: Paginated<TrackingNumber> | undefined,
      isLoading: boolean,
      error: Error | null,
      isFetching: boolean
    } = useTrackingNumbers({
      number: filters.number,
      forwardingVoiceNumber: filters.forwardingVoiceNumber,
      marketingSourceId: filters.marketingSourceId,
      page: currentPage,
      limit: itemsPerPage
    });

  const [isCreateDialogOpen, setIsCreateDiagloOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDiagloOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [editingTn, setEditingTn] = useState<TrackingNumber | null>(null);
  const [tnToDelete, setTnToDelete] = useState<TrackingNumber | null>(null);

  // Reset lastAction when network settles (after the useMarketingSources hook)
  useEffect(() => {
    if (!isFetching) setLastAction(null);
  }, [isFetching]);


  {/* ── Handlers for Pagination ──────────────────────────────────────────────────────*/ }
  const handlePageChange = (page: number) => {
    setLastAction('page');
    setCurrentPage(page);

    setFilters({
      ...filters,
      page,
      limit: itemsPerPage
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
      limit: newItemsPerPage
    });
  };

  {/* ── Handlers for Creating  ────────────────────────────────────────*/ }
  const handleNumberCreated = () => {
    // after creating, jump to first page to see the newest record
    setCurrentPage(1);
  }

  /* Loading flags:
    - shouldShowFullLoader: initial load or filter fetch (hide table)
    - isPaginatingNow: page/limit fetch (keep table, light spinner) */
  const shouldShowFullLoader =
    (isLoading && !data) ||
    (isFetching && (lastAction === 'filter' || (!data && lastAction === null)));

  const isPaginatingNow = isFetching && (lastAction === 'page' || lastAction === 'limit');

  return (
    <>
      <div>wegweg : {isLoading ? 'shouldShow' : 'notShow'}</div>
      <Card className="border-purple-200 border bg-gradient-to-br from-white to-purple-50">
        {/* ── Header ───────────────────────────────────────────────────────────── */}
        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-t-lg">
          <div>
            <CardTitle className="text-2xl text-white">Call tracking numbers</CardTitle>
            <CardDescription className='mt-2 mb-5 text-white/80'>Manage your tracking numbers</CardDescription>
          </div>
          <div>
            <Button
              className={`bg-purple-500/80 border-gray-300/80 border hover:bg-purple-500
                hover:border-gray-200/80 text-white focus-visible: ring-offset-purple-700
                focus-visible:ring-gray-300/80 focus-visible:border-0`}
              onClick={() => { setIsCreateDiagloOpen(true); }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Tracking Number
            </Button>
          </div>
        </CardHeader>

        {/* ── List  ────────────────────────────────────────────────────────────────────────── */}
        <CardContent className='mt-3'>
          {/* ── Filter Bar ───────────────────────────────────────────────────────*/}
          <FilterBar
            defaultValues={filters}
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
            }}
          />
          <div className="min-h-0 max-h-[calc(100vh-338px)] overflow-y-auto pt-5">
            <div className={cn(
              "relative transition-opacity duration-200",
              isPaginatingNow && [
                "opacity-50",
                "pointer-events-none",
                "blur-[1.5px]",
                "cursor-not-allowed"
              ]
            )}>
              <Table className='table-fixed'>
                <TableHeader className='sticky top-0 z-10'>
                  <TableRow className="bg-purple-200 hover:bg-purple-200">
                    <TableHead className="text-purple-800 font-semibold">Tracking Number</TableHead>
                    <TableHead className="text-purple-800 font-semibold">Forwarding Number</TableHead>
                    <TableHead className="text-purple-800 font-semibold">Marketing Source</TableHead>
                    <TableHead className="text-purple-800 font-semibold">Created</TableHead>
                    <TableHead className="text-purple-800 font-semibold">Updated</TableHead>
                    <TableHead className="text-purple-800 font-semibold text-right w-35">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className='cursor-pointer'>
                  {!error && !shouldShowFullLoader && data && data.items.map((tn) => (
                    <TableRow key={tn.id} className="hover:bg-purple-100/50">
                      <TableCell className='text-purple-800'>
                        <div className="flex items-center gap-2 font-medium">
                          <Phone className="w-4 h-4 text-purple-600" />
                          {fmt(tn.number)}
                        </div>
                      </TableCell>
                      <TableCell className='text-purple-600 font-medium'>
                        <div className="flex items-center gap-2">
                          {tn?.forwardingVoiceNumber ? (
                            <>
                              <PhoneForwarded className="w-4 h-4 text-purple-600" />
                              {fmt(tn.forwardingVoiceNumber)}
                            </>
                          ) : (
                            "──────"
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-purple-600">
                        <TruncText
                          value={tn?.marketingSource?.name ?? ''}
                          lines={1}
                        />
                        {tn?.marketingSource?.description && (
                          <TruncText
                            lines={3}
                            preserveNewlines
                            value={tn.marketingSource.description}
                            className="text-sm text-muted-foreground mt-1"
                          />
                        )}
                      </TableCell>
                      <TableCell className='text-purple-600'>
                        {tn?.createdAt
                          ? new Date(tn.createdAt).toLocaleString(undefined, {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false
                          })
                          : "-"}
                      </TableCell>
                      <TableCell className='text-purple-600'>
                        {tn?.updatedAt
                          ? new Date(tn.updatedAt).toLocaleString(undefined, {
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
                            onClick={() => {
                              setEditingTn(tn);
                              setIsEditDiagloOpen(true);
                            }}
                            disabled={isEditDialogOpen}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-200/60 hover:border-gray-600/50"
                            onClick={() => {
                              setTnToDelete(tn);
                              setIsDeleteDialogOpen(true);
                            }}
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
            {(error || shouldShowFullLoader) ? (
              <div
                className={cn(
                  'text-center py-8 text-lg',
                  error ? 'text-destructive' : 'text-purple-500'
                )}
              >
                {error ? (
                  <span className='mt-5'>
                    Failed to load tracking numbers. Please try again.
                  </span>
                ) : (
                  <div role="status" aria-live="polite" className="flex flex-col items-center gap-5">
                    <span>Loading tracking numbers...</span>
                    <Spinner
                      variant="purple-700"
                      track="purple-200"
                      label="Loading tracking numbers..."
                    />
                  </div>
                )}
              </div>
            ) : (
              data && data?.items.length === 0 ? (
                <div className="text-center py-8 text-purple-500">
                  No tracking numbers found. Create your first tracking number to get started.
                </div>
              ) : null
            )}
          </div>
          {(!error && !shouldShowFullLoader && data && data.items.length > 0) && (
            <Pagination
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              totalItems={data.items.length}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
              isPaginating={isPaginatingNow}
            />
          )}
        </CardContent>
      </Card>

      {/* ── Add Tracking Number Dialgo  ────────────────────────────────────────────────────────────────────────── */}
      <CreateTrackingNumberDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDiagloOpen}
        onCreateSucess={handleNumberCreated}
      />

      {/* ── Edit Tracking Number Dialgo  ────────────────────────────────────────────────────────────────────────── */}
      <EditTrackingNumberDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDiagloOpen}
        tn={editingTn} />

      {/* ── Delete Confirmation Dialog  ────────────────────────────────────────────────────────────────────────── */}
      <DeleteTrackingNumberDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        tnToDelete={tnToDelete}
      />
    </>
  );
}

export default Page;

