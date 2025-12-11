/* eslint-disable @typescript-eslint/no-unused-vars */

"use client"

// ── React & libs ──────────────────────────────────────────────────────
import { useState } from "react";
import { useRouter, useSearchParams } from 'next/navigation';
import { subDays, startOfDay, endOfDay } from "date-fns";


// ── App utilities / hooks / state ────────────────────────────────────
import { useDashboardStatic } from "@/features/dashboard/api";
import { serializeDateParam, parseDateParam } from "@/lib/utils";

// ── UI (radix + icons) ───────────────────────────────────────────────ct';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';

// ── types ───────────────────────────────────────────────
import { CallSummaryKpis } from "@/types/analytics";
import { CallSummaryCard } from "../dashboard/components/CallSummaryCard";

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

const emptyKpis: CallSummaryKpis = {
  totalCalls: { value: 0, changePercent: 0 },
  connectedCalls: 0,
  requestedAppointments: 0,
  bookedAppointments: 0,
  conversationRatePercent: 0,
  bookingRatePercent: 0,
  avgSentiment: null,
};

const withDefaults = (k?: CallSummaryKpis | null): CallSummaryKpis => ({
  ...emptyKpis,
  ...(k ?? {}),
  totalCalls: {
    ...emptyKpis.totalCalls,
    ...(k?.totalCalls ?? {}),
  },
});


const Home = () => {

  const [filters, _setFilters] = useUrlFilters();

  const [marketingSourceIds, _setMarketingSourceIds] = useState<string[]>(filters?.marketingSourceIds ?? []);

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;


  // STATIC metrics – today / last7 / last30
  const { data: staticData, isLoading: isStaticLoading } = useDashboardStatic({ marketingSourceIds, timezone });

  const salesStatic = staticData?.summary.sales;
  const serviceStatic = staticData?.summary.service;

  const salesToday = withDefaults(salesStatic?.today);
  const salesLast7 = withDefaults(salesStatic?.last7Days);
  const salesLast30 = withDefaults(salesStatic?.last30Days);

  const serviceToday = withDefaults(serviceStatic?.today);
  const serviceLast7 = withDefaults(serviceStatic?.last7Days);
  const serviceLast30 = withDefaults(serviceStatic?.last30Days);

  return (
    <div className=" bg-gray-50">
      <Card className="border-purple-200 border bg-gradient-to-br from-white to-purple-50">
        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-t-lg">
          <CardTitle className="text-2xl text-white">Performance Snapshot</CardTitle>
        </CardHeader>
      </Card>

      <div className="mx-auto space-y-6 mt-5"> {/** max-w-7xl  */}
        {/* 1️⃣ STATIC METRICS – Sales (top row) */}
        <div className="mb-3">
          <h2 className="text-lg font-semibold text-purple-800">Sales Calls</h2>
          <p className="text-xs text-gray-500">
            Today, last 7 days, and last 30 days (overall).
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <CallSummaryCard
            title="Calls Today"
            departmentLabel="Sales"
            metrics={salesToday}
            isLoading={isStaticLoading}
          />
          <CallSummaryCard
            title="Calls Last 7 Days"
            departmentLabel="Sales"
            metrics={salesLast7}
            isLoading={isStaticLoading}
          />
          <CallSummaryCard
            title="Calls Last 30 Days"
            departmentLabel="Sales"
            metrics={salesLast30}
            isLoading={isStaticLoading}
          />
          {/* <MetricCard
            title="Calls last 30 Days"
            value={callsLast30.value}
            changePercent={callsLast30.changePercent}
            isLoading={isLoading}
            icon={<PhoneIcon className="h-6 w-6 text-purple-600" />}
          /> */}
        </div>

        {/* Bottom Row - Minutes Metrics */}
        <div className="mb-3">
          <h2 className="text-lg font-semibold text-gray-800">
            Service Calls
          </h2>
          <p className="text-xs text-gray-500">
            Today, last 7 days, and last 30 days (overall).
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <CallSummaryCard
            title="Calls Today"
            departmentLabel="Service"
            metrics={serviceToday}
            isLoading={isStaticLoading}
          />
          <CallSummaryCard
            title="Calls Last 7 Days"
            departmentLabel="Service"
            metrics={serviceLast7}
            isLoading={isStaticLoading}
          />
          <CallSummaryCard
            title="Calls Last 30 Days"
            departmentLabel="Service"
            metrics={serviceLast30}
            isLoading={isStaticLoading}
          />
        </div>
      </div>
    </div>
  );
}

export default Home;