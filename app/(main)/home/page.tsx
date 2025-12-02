"use client"

// ── React & libs ──────────────────────────────────────────────────────
import { useState } from "react";
import { useRouter, useSearchParams } from 'next/navigation';
import { subDays, startOfDay, endOfDay } from "date-fns";

// ── App utilities / hooks / state ────────────────────────────────────
import { useDashboard } from "@/features/dashboard/api";
import { serializeDateParam, parseDateParam } from "@/lib/utils";

// ── UI (radix + icons) ───────────────────────────────────────────────
import { MetricCard } from '@/app/(main)/home/components/MetricsCard';
import { ChartCard } from '@/app/(main)/home/components/ChartCard'
import { PhoneIcon, ClockIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';

// ── types ───────────────────────────────────────────────
import type { DateRange } from "@/components/DateRangePicker";


interface Filters {
  from?: Date;
  to?: Date;

  marketingSourceIds?: string[];
}


function useUrlFilters(): [Filters, (f: Filters) => void, () => void] {
  const router = useRouter();
  const sp = useSearchParams();

  const current: Filters = {
    marketingSourceIds: sp.get('marketingSourceId') ? sp.get('marketingSourceId')?.split(',') : [],
    from: parseDateParam(sp.get('from')) ?? startOfDay(subDays(new Date(), 6)),
    to: parseDateParam(sp.get('to')) ?? endOfDay(new Date()),
  };

  const setFilters = (f: Filters) => {
    const q = new URLSearchParams();

    if (f?.from) {
      const fromStr = serializeDateParam(f.from);
      if (fromStr) q.set('from', fromStr);
    }
    if (f?.to) {
      const toStr = serializeDateParam(f.to);
      if (toStr) q.set('to', toStr);
    }

    if (f?.marketingSourceIds && f.marketingSourceIds.length > 0) {
      const ids = f.marketingSourceIds.map(String).join(",");
      q.set("marketingSourceId", ids);
    }

    router.replace(`?${q.toString()}`, { scroll: false });
  };

  const clear = () => router.replace('?', { scroll: false });

  return [current, setFilters, clear];
}


const Home = () => {

  const [filters, setFilters] = useUrlFilters();

  const [dateRange, setDateRange] = useState<DateRange>({
    from: filters.from,
    to: filters.to,
  });

  const [marketingSourceIds, setMarketingSourceIds] = useState<string[]>(filters?.marketingSourceIds ?? []);

  const { data, isLoading, isError } = useDashboard({
    from: dateRange.from?.toISOString(),
    to: dateRange.to?.toISOString(),
    marketingSourceIds
    // groupBy: undefined,
  });

  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range);

    setFilters({
      ...filters,
      from: range.from,
      to: range.to
    })
  }

  const handleMarketingSourceIdsChange = (ids: string[]) => {
    setMarketingSourceIds(ids);

    setFilters({
      ...filters,
      marketingSourceIds: ids
    });
  }

  const summary = data?.summary;

  const callsToday = summary?.callsToday ?? { value: 0, changePercent: 0 };
  const callsLast7 =
    summary?.callsLast7Days ?? { value: 0, changePercent: 0 };
  const callsLast30 =
    summary?.callsLast30Days ?? { value: 0, changePercent: 0 };

  const minutesToday = summary?.minutesToday ?? { value: 0, changePercent: 0 };
  const minutesLast7 =
    summary?.minutesLast7Days ?? { value: 0, changePercent: 0 };
  const minutesLast30 =
    summary?.minutesLast30Days ?? { value: 0, changePercent: 0 };


  return (
    <div className=" bg-gray-50">
      <Card className="border-purple-200 border bg-gradient-to-br from-white to-purple-50">
        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-t-lg">
          <CardTitle className="text-2xl text-white">Call Tracking Dashboard</CardTitle>
        </CardHeader>
      </Card>

      <div className="mx-auto space-y-6 mt-5"> {/** max-w-7xl  */}
        {/* Top Row - Call Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard
            title="Calls Today"
            value={callsToday.value}
            changePercent={callsToday.changePercent}
            isLoading={isLoading}
            icon={<PhoneIcon className="h-6 w-6 text-purple-600" />}
          />
          <MetricCard
            title="Calls Last 7 Days"
            value={callsLast7.value}
            changePercent={callsLast7.changePercent}
            isLoading={isLoading}
            icon={<PhoneIcon className="h-6 w-6 text-purple-600" />}
          />
          <MetricCard
            title="Calls last 30 Days"
            value={callsLast30.value}
            changePercent={callsLast30.changePercent}
            isLoading={isLoading}
            icon={<PhoneIcon className="h-6 w-6 text-purple-600" />}
          />
        </div>

        {/* Chart Section */}
        <ChartCard
          dateRange={dateRange}
          onDateRangeChange={handleDateRangeChange}
          marketingSourceIds={marketingSourceIds}
          onMarketingSourcesChange={handleMarketingSourceIdsChange}
          chartPoints={data?.chart.points ?? []}
          groupBy={data?.chart.groupBy ?? 'day'}
          isLoading={isLoading}
          hasError={isError}
        />

        {/* Bottom Row - Minutes Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard
            title="Minutes Today"
            value={minutesToday.value}
            changePercent={minutesToday.changePercent}
            isLoading={isLoading}
            icon={<ClockIcon className="h-6 w-6 text-purple-600" />}
          />
          <MetricCard
            title="Minutes Last 7 Days"
            value={minutesLast7.value}
            changePercent={minutesLast7.changePercent}
            isLoading={isLoading}
            icon={<ClockIcon className="h-6 w-6 text-purple-600" />}
          />
          <MetricCard
            title="Minutes Last 30 Days"
            value={minutesLast30.value}
            changePercent={minutesLast30.changePercent}
            isLoading={isLoading}
            icon={<ClockIcon className="h-6 w-6 text-purple-600" />}
          />
        </div>
      </div>
    </div>
  );
}

export default Home;