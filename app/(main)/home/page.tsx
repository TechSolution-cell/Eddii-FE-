"use client"

// ── React & libs ──────────────────────────────────────────────────────
import { useState } from "react";
import { subDays, startOfDay, endOfDay } from "date-fns";

// ── App utilities / hooks / state ────────────────────────────────────
import { useDashboard } from "@/features/dashboard/api";

// ── UI (radix + icons) ───────────────────────────────────────────────
import { MetricCard } from '@/app/(main)/home/components/MetricsCard';
import { ChartCard } from '@/app/(main)/home/components/ChartCard'
import { PhoneIcon, ClockIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';

// ── types ───────────────────────────────────────────────
import type { DateRange } from "@/components/DateRangePicker";

const Home = () => {

  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfDay(subDays(new Date(), 29)),
    to: endOfDay(new Date()),
  });

  const [marketingSourceIds, setMarketingSourceIds] = useState<string[]>([]);

  const { data, isLoading, isError } = useDashboard({
    from: dateRange.from?.toISOString(),
    to: dateRange.to?.toISOString(),
    marketingSourceIds
    // groupBy: undefined,
  });

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
          onDateRangeChange={setDateRange}
          marketingSourceIds={marketingSourceIds}
          onMarketingSourcesChange={setMarketingSourceIds}
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