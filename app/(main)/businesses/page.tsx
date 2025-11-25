'use client';

// ── React & libs ──────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// ── App utilities / hooks / state ────────────────────────────────────
import { cn } from '@/lib/utils';
import {
  useBusinesses,
} from '@/features/businesses/api';
// import { useToast } from '@/hooks/use-toast';

// ── UI (radix + icons) ───────────────────────────────────────────────
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Pagination } from '@/components/Pagination';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Plus, Trash2 } from 'lucide-react';
import CreateBusinessDialog from './components/dialogs/CreateBusinessDialog';
import EditBusinessDialog from './components/dialogs/EditBusinessDialog';
import { FilterBar, type Filters } from './components/FilterBar';

// ── Types ─────────────────────────────────────────────────────────────
import { Business, Paginated } from '@/types';
import DeleteBusinessDialog from './components/dialogs/DeleteBusinessDialog';

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
    email: sp.get('email') ?? '',

    page: sp.get('page') ? Number(sp.get('page')) : 1,
    limit: sp.get('limit') ? Number(sp.get('limit')) : 25,
  };

  const setFilters = (f: FiltersWithPagination) => {
    const q = new URLSearchParams();
    if (f.name) q.set('name', f.name);
    if (f.email) q.set('email', f.email);

    // pagination
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

  // const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(filters?.page ?? 1);
  const [itemsPerPage, setItemsPerPage] = useState(filters?.limit ?? 25);


  const { data, isLoading, error, isFetching }:
    {
      data: Paginated<Business> | undefined,
      isLoading: boolean,
      error: Error | null,
      isFetching: boolean,
    } = useBusinesses({
      name: filters.name,
      email: filters.email,
      page: currentPage,
      limit: itemsPerPage
      // sortBy, sortOrder, createdFrom/createdTo if needed
    });

  // Reset lastAction when network settles (after the useMarketingSources hook)
  useEffect(() => {
    if (!isFetching) setLastAction(null);
  }, [isFetching]);


  const [editingBiz, setEditingBiz] = useState<Business | null>(null);
  const [bizToDelete, setBizToDelete] = useState<Business | null>(null);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

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

  {/* ── Handlers for Creating ──────────────────────────────────────────────────────*/ }
  const handleBusinessCreated = () => {
    // after creating, jump to first page to see the newest record
    setCurrentPage(1);
  }

  {/* ── Handlers for Editing ──────────────────────────────────────────────────────*/ }
  const handleEditClick = (b: Business) => {
    if (!b) return;

    setEditingBiz(b);
    setIsEditDialogOpen(true);
  }

  {/* ── Handlers for deleting ──────────────────────────────────────────────────────*/ }
  const handleDeleteClick = (b: Business) => {
    setBizToDelete(b);
    setIsDeleteDialogOpen(true);
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
      <Card className="border-purple-200 border bg-gradient-to-br from-white to-purple-50">

        {/* ── Header ───────────────────────────────────────────────────────────── */}
        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-t-lg">
          <div>
            <CardTitle className="text-2xl text-white">Business Management</CardTitle>
            <CardDescription className='mt-2 mb-5 text-white/80'>Add a new business to manage marketing sources and track calls.</CardDescription>
          </div>
          <div>
            <Button
              className="bg-purple-500/80 border-gray-300/80 border hover:bg-purple-500 hover:border-gray-200/80 text-white"
              onClick={() => { setIsCreateDialogOpen(true); }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Business
            </Button>
          </div>
        </CardHeader>

        {/* ── List  ───────────────────────────────────────────────────────────── */}
        <CardContent className='mt-5'>
          {/* ── Filter Bar ───────────────────────────────────────────────────────*/}
          <FilterBar
            defaultValues={filters}
            isDisabled={isFetching}
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

          {/* ── Table ───────────────────────────────────────────────────────────── */}
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
                    <TableHead className="text-purple-800 font-semibold">Email</TableHead>
                    <TableHead className="text-purple-800 font-semibold">Password</TableHead>
                    <TableHead className="text-purple-800 font-semibold">Business Name</TableHead>
                    <TableHead className="text-purple-800 font-semibold">Used / Limit</TableHead>
                    <TableHead className="text-purple-800 font-semibold">Created</TableHead>
                    <TableHead className="text-purple-800 font-semibold">Updated</TableHead>
                    <TableHead className="text-right text-purple-800 font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className='cursor-pointer'>
                  {!error && !shouldShowFullLoader && data && data?.items?.map((b) => (
                    <TableRow key={b.id} className="hover:bg-purple-100/50">
                      <TableCell className="font-medium text-purple-900">{b.email}</TableCell>
                      <TableCell className="font-medium  text-purple-400">********</TableCell>
                      <TableCell className="text-purple-700">{b.businessName}</TableCell>
                      <TableCell className="text-purple-700">{`${b.trackingNumbersUsedCount} / ${b.maxTrackingNumbers}`}</TableCell>
                      <TableCell className="text-purple-600">
                        {b?.createdAt
                          ? new Date(b.createdAt).toLocaleString(undefined, {
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
                        {b?.updatedAt
                          ? new Date(b.updatedAt).toLocaleString(undefined, {
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
                            onClick={() => { handleEditClick(b); }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className=" text-red-500 hover:text-red-700 hover:bg-red-200/60 hover:border-gray-600/50"
                            onClick={() => handleDeleteClick(b)}
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
                    Failed to load businesses. Please try again.
                  </span>
                ) : (
                  <div role="status" aria-live="polite" className="flex flex-col items-center gap-5">
                    <span>Loading your businesses...</span>
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
                <div className="text-center py-8 text-purple-500">
                  No business found. Create your first business to get started.
                </div>
              ) : null
            )}
          </div>

          {/* ── Pagination Control ─────────────────────────────────────────────── */}
          {!error && !shouldShowFullLoader && data && data?.items.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalItems={data?.items.length}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
              isPaginating={isPaginatingNow}
            />
          )}
        </CardContent>
      </Card >

      {/* ── Create Dialog  ───────────────────────────────────────────────────────────── */}
      <CreateBusinessDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCreateSuccess={handleBusinessCreated} />

      {/* ── Edit Dialog ───────────────────────────────────────────────────────────── */}
      <EditBusinessDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        editingBusiness={editingBiz} />

      {/* ── Delete Confirmation Dialog ───────────────────────────────────────────────────────────── */}
      <DeleteBusinessDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        businessToDelete={bizToDelete}
      />
    </>
  );
}
