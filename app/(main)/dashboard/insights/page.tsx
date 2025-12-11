"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { subDays, startOfDay, endOfDay, format } from "date-fns";

import { useDashboardRange } from "@/features/dashboard/api";
import { serializeDateParam, parseDateParam } from "@/lib/utils";

import { ChartCard } from "@/app/(main)/dashboard/components/ChartCard";
import { CallSummaryCard } from "@/app/(main)/dashboard/components/CallSummaryCard";

import type { CallSummaryKpis } from "@/types";
import type { DateRange } from "@/components/DateRangePicker";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

interface Filters {
    from?: Date;
    to?: Date;
    marketingSourceIds?: string[];
}

function useUrlFilters(): [Filters, (f: Filters) => void] {
    const router = useRouter();
    const sp = useSearchParams();

    const current: Filters = {
        marketingSourceIds: sp.get("marketingSourceIds")
            ? sp.get("marketingSourceIds")!.split(",").filter(Boolean)
            : [],
        from: parseDateParam(sp.get("from")) ?? startOfDay(subDays(new Date(), 29)), // Last 30 days
        to: parseDateParam(sp.get("to")) ?? endOfDay(new Date()),
    };

    const setFilters = (f: Filters) => {
        const q = new URLSearchParams();

        if (f.from) {
            const fromStr = serializeDateParam(f.from);
            if (fromStr) q.set("from", fromStr);
        }

        if (f.to) {
            const toStr = serializeDateParam(f.to);
            if (toStr) q.set("to", toStr);
        }

        if (f.marketingSourceIds && f.marketingSourceIds.length > 0) {
            q.set("marketingSourceIds", f.marketingSourceIds.join(","));
        }

        router.replace(`?${q.toString()}`, { scroll: false });
    };

    return [current, setFilters];
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

const formatRangeLabel = (range: DateRange): string => {
    const { from, to } = range;

    if (from && to) {
        return `${format(from, "MMM d, yyyy")} – ${format(to, "MMM d, yyyy")}`;
    }
    if (from) return `From ${format(from, "MMM d, yyyy")}`;
    if (to) return `Until ${format(to, "MMM d, yyyy")}`;
    return "No date range selected";
};

export default function InsightsPage() {
    const [filters, setFilters] = useUrlFilters();

    const [dateRange, setDateRange] = useState<DateRange>({
        from: filters.from,
        to: filters.to,
    });

    const [marketingSourceIds, setMarketingSourceIds] = useState<string[]>(
        filters.marketingSourceIds ?? []
    );

    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const {
        data,
        isLoading,
        isFetching,
        isError,
    } = useDashboardRange({
        from: dateRange.from?.toISOString(),
        to: dateRange.to?.toISOString(),
        marketingSourceIds,
        timezone,
    });

    const salesSelected = withDefaults(data?.summary.sales.selectedRange);
    const serviceSelected = withDefaults(data?.summary.service.selectedRange);

    const handleDateRangeChange = (range: DateRange) => {
        setDateRange(range);
        setFilters({
            ...filters,
            from: range.from,
            to: range.to,
            marketingSourceIds,
        });
    };

    const handleMarketingSourceIdsChange = (ids: string[]) => {
        setMarketingSourceIds(ids);
        setFilters({
            ...filters,
            marketingSourceIds: ids,
            from: dateRange.from,
            to: dateRange.to,
        });
    };

    return (
        <div className=" bg-gray-50">
            <Card className="border-purple-200 border bg-gradient-to-br from-white to-purple-50">
                <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-t-lg">
                    <CardTitle className="text-2xl text-white">Date Range Insights</CardTitle>
                </CardHeader>
            </Card>

            <div className="mx-auto space-y-6 mt-5"> {/** max-w-7xl  */}
                {/* SELECTED RANGE METRICS – Sales & Service */}
                <section>
                    <div className="mb-3">
                        <h2 className="text-lg font-semibold text-purple-800">
                            Selected Date Range
                        </h2>
                        <p className="text-xs text-gray-500">
                            {formatRangeLabel(dateRange)} — filtered by date range and
                            marketing sources.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <CallSummaryCard
                            title="Sales Calls"
                            departmentLabel="Sales"
                            metrics={salesSelected}
                            isLoading={isLoading}
                        />
                        <CallSummaryCard
                            title="Service Calls"
                            departmentLabel="Service"
                            metrics={serviceSelected}
                            isLoading={isLoading}
                        />
                    </div>
                </section>

                {/* CHART – Calls & Minutes over selected range */}
                <section>
                    <ChartCard
                        dateRange={dateRange}
                        onDateRangeChange={handleDateRangeChange}
                        marketingSourceIds={marketingSourceIds}
                        onMarketingSourcesChange={handleMarketingSourceIdsChange}
                        chartPoints={data?.chart.points ?? []}
                        groupBy={data?.chart.groupBy ?? "day"}
                        isLoading={isFetching}
                        hasError={isError}
                    />
                </section>
            </div>
        </div>
    );
}
