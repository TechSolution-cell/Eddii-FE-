'use client';

// ── React & libs ──────────────────────────────────────────────────────
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { subDays, startOfDay, endOfDay } from 'date-fns';

// ── App utilities / hooks / state ────────────────────────────────────
import { cn, fmt } from '@/lib/utils';
import { useCallLogs } from '@/features/call-logs/api';


// ── UI (radix + icons) ───────────────────────────────────────────────
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/Pagination';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CallLogDetailDialog, getStatusColor } from './components/CallLogDetailDialog';
import { Spinner } from '@/components/ui/spinner';
import { TruncText } from '@/components/TruncText';
import { Button } from '@/components/ui/button';
import { FilterBar, Filters } from './components/FilterBar';

import { Eye, Phone, User } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────
import { type CallLog, type Paginated } from '@/types';

type LastAction = 'page' | 'limit' | 'filter' | 'other' | null;

type FiltersWithPagination = Filters & {
  page?: number;
  limit?: number;
};

const serializeDate = (date?: Date | null) =>
  date ? date.toISOString() : undefined;

// Safely parse, return undefined on bad value
const parseDate = (value: string | null) => {
  if (!value) return undefined;
  const d = new Date(value);
  return isNaN(d.getTime()) ? undefined : d;
};

function useUrlFilters(): [FiltersWithPagination, (f: FiltersWithPagination) => void, () => void] {
  const router = useRouter();
  const sp = useSearchParams();

  const current: FiltersWithPagination = {
    marketingSourceId: sp.get('marketingSourceId') ?? '',
    from: parseDate(sp.get('from')) ?? startOfDay(subDays(new Date(), 29)),
    to: parseDate(sp.get('to')) ?? endOfDay(new Date()),

    page: sp.get('page') ? Number(sp.get('page')) : undefined,
    limit: sp.get('limit') ? Number(sp.get('limit')) : undefined,
  };

  const setFilters = (f: FiltersWithPagination) => {
    const q = new URLSearchParams();

    // filters
    if (f.marketingSourceId) q.set('marketingSourceId', f.marketingSourceId);

    if (f.from) {
      const serializedFrom = serializeDate(f.from);
      if (serializedFrom) q.set('from', serializedFrom);
    }

    if (f.to) {
      const serializedTo = serializeDate(f.to);
      if (serializedTo) q.set('to', serializedTo);
    }

    // pagination
    if (f?.page) q.set('page', String(f.page));
    if (f?.limit) q.set('limit', String(f.limit));

    router.replace(`?${q.toString()}`, { scroll: false });
  };

  const clear = () => router.replace('?', { scroll: false });

  return [current, setFilters, clear];
}

const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export default function Page() {

  const [lastAction, setLastAction] = useState<LastAction>(null);
  const [filters, setFilters, clearFilters] = useUrlFilters();

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);


  const { data, isLoading, error, isFetching }:
    {
      data: Paginated<CallLog> | undefined,
      isLoading: boolean,
      error: Error | null,
      isFetching: boolean
    } = useCallLogs({
      marketingSourceId: filters.marketingSourceId,
      startedFrom: serializeDate(filters.from),
      startedTo: serializeDate(filters.to),
      page: currentPage,
      limit: itemsPerPage
      // sortBy, sortOrder if needed
    });

  const [selectedLog, setSelectedLog] = useState<CallLog | null>(null);

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

    setFilters({
      ...filters,
      page: 1,
      limit: newItemsPerPage,
    });
  };

  /* Loading flags:
     - shouldShowFullLoader: initial load or filter fetch (hide table)
     - isPaginatingNow: page/limit fetch (keep table, light spinner) */
  const shouldShowFullLoader =
    (isLoading && !data) ||
    (isFetching && (lastAction === 'filter' || (!data && lastAction === null)));

  return (
    <>
      <Card className="border-purple-200 border bg-gradient-to-br from-white to-purple-50">
        {/* ── Header ───────────────────────────────────────────────────────────── */}
        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-t-lg">
          <div>
            <CardTitle className="text-2xl text-white">Call Logs</CardTitle>
            <CardDescription className='mt-2 mb-5 text-white/80'>View call details and transcripts</CardDescription>
          </div>
        </CardHeader>

        {/* ── List  ────────────────────────────────────────────────────────────────────────── */}
        <CardContent className='mt-3'>
          {/* ── DateRangePicker  ───────────────────────────────────────────────────────────── */}
          <div className='flex justify-end mb-3 gap-5'>
            <FilterBar
              defaultValues={filters}
              onChange={(v: Filters) => {
                setLastAction('filter');

                // reset page when filters change
                setCurrentPage(1);
                setFilters({
                  ...v,
                  page: 1,
                  limit: itemsPerPage,
                });
              }}
              onClear={() => {
                setLastAction('filter');
                setCurrentPage(1);
                clearFilters();
              }}
            />

            <div className="flex items-center gap-2 text-sm text-purple-600">
              <Phone className="w-4 h-4" />
              <span>{data?.meta.total} total calls</span>
            </div>
          </div>

          {/* ── Table  ────────────────────────────────────────────────────────────────────────── */}
          <div className="min-h-0 max-h-[calc(100vh-338px)] overflow-y-auto">
            <Table className='table-fixed'>
              <TableHeader className='sticky top-0 z-10'>
                <TableRow className="bg-purple-200 hover:bg-purple-200">
                  <TableHead className="text-purple-800 font-semibold ">Caller</TableHead>
                  <TableHead className="text-purple-800 font-semibold">Tracking Number</TableHead>
                  <TableHead className="text-purple-800 font-semibold">Marketing Source</TableHead>
                  <TableHead className="text-purple-800 font-semibold">Duration</TableHead>
                  <TableHead className="text-purple-800 font-semibold">Status</TableHead>
                  <TableHead className="text-purple-800 font-semibold">Date</TableHead>
                  <TableHead className="text-right text-purple-800 font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className='cursor-pointer'>
                {!error && data && !shouldShowFullLoader && data.items.map((cl) => (
                  <TableRow key={cl.id} className="hover:bg-purple-100/50">
                    <TableCell className="font-medium text-purple-800">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-500" />
                        {cl.callerNumber ? fmt(cl.callerNumber) : '──────'}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-purple-900">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-purple-600" />
                        {cl?.trackingNumber ? fmt(cl.trackingNumber) : '──────'}
                      </div>
                    </TableCell>
                    <TableCell className="text-purple-600">
                      <TruncText
                        value={cl?.marketingSource?.name ?? ''}
                        lines={1}
                      />
                      {cl?.marketingSource?.description && (
                        <TruncText
                          lines={3}
                          preserveNewlines
                          value={cl.marketingSource.description}
                          className="text-sm text-muted-foreground mt-1"
                        />
                      )}
                    </TableCell>
                    <TableCell className="text-purple-600">
                      {formatDuration(cl.durationSeconds)}
                    </TableCell>
                    <TableCell className="text-purple-600">
                      <Badge className={getStatusColor(cl.status)}>
                        {cl.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-purple-600">
                      {cl?.callStartedAt
                        ? new Date(cl?.callStartedAt).toLocaleString(undefined, {
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
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedLog(cl);
                          }}
                          className="text-purple-600 border-purple-200 hover:bg-purple-50 gap-1"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Details
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>


            {(shouldShowFullLoader || error) ? (
              <div
                className={cn(
                  'text-center py-8 text-lg',
                  isFetching ? 'text-purple-500' : 'text-destructive'
                )}
              >
                {shouldShowFullLoader ? (
                  <div role="status" aria-live="polite" className="flex flex-col items-center gap-5">
                    <span>Loading your call logs...</span>
                    <Spinner
                      variant="purple-700"
                      track="purple-200"
                      label="Loading call logs..."
                    />
                  </div>
                ) : (
                  <span className='mt-5'>
                    Failed to load call logs. Please try again.
                  </span>
                )}
              </div>
            ) : (
              data && data?.items.length === 0 ? (
                <div className="text-center py-8 text-purple-500 mt-5">
                  No calls found. Calls will appear here once they start coming in.
                </div>
              ) : null
            )}
          </div>

          {/* ── Pagination Control ───────────────────────────────────────────────────────────── */}
          {!shouldShowFullLoader && data && data?.items.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalItems={data.meta.total}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
            />
          )}

        </CardContent>
      </Card>

      {selectedLog && (
        <CallLogDetailDialog
          log={selectedLog}
          open={!!selectedLog}
          onClose={() => setSelectedLog(null)}
        />
      )}
    </>
  );
}
