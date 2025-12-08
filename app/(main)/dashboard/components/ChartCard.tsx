"use client";

// ── React & libs ──────────────────────────────────────────────────────
import { useMemo, useState } from "react";
import { endOfWeek, format, startOfWeek } from "date-fns";

// ── App utilities / hooks / state ────────────────────────────────────
import { cn } from '@/lib/utils';


// ── UI (radix + icons) ───────────────────────────────────────────────
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from '@/components/ui/spinner';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { DateRangePicker, DateRange } from "@/components/DateRangePicker";
import { MarketingSourceSelect } from "./MarketingSourceSelect";

// ── Types ───────────────────────────────────────────────
import type { DateGrouping } from "@/types";


const chartConfig = {
  calls: {
    label: "Calls",
    color: "#2269f9",
  },
  minutes: {
    label: "Minutes",
    color: "#05df72",
  },
};

type ChartPointDto = {
  bucket: string; // ISO date from backend
  calls: number;
  minutes: number;
};

type ChartCardProps = {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  chartPoints: ChartPointDto[];
  groupBy: DateGrouping;

  marketingSourceIds: string[];
  onMarketingSourcesChange: (ids: string[]) => void;

  isLoading: boolean;
  hasError: boolean;
};


export function ChartCard({
  dateRange,
  onDateRangeChange,
  chartPoints,
  groupBy,
  marketingSourceIds,
  onMarketingSourcesChange,
  isLoading,
  hasError,
}: ChartCardProps) {

  const [showCalls, setShowCalls] = useState(true);
  const [showMinutes, setShowMinutes] = useState(true);


  // groupBy comes from your dashboard API response: chart.groupBy
  const chartData = useMemo(
    () =>
      chartPoints.map((p) => ({
        name: formatBucketLabel(p.bucket, groupBy),
        calls: p.calls,
        minutes: Number(p.minutes.toFixed(2)),
      })),
    [chartPoints, groupBy]
  );

  // helper
  function formatBucketLabel(bucket: string, groupBy: DateGrouping): string {
    if (groupBy === "month") return bucket;

    // Normalize bucket like "Week of 2025-09-08" -> "2025-09-08"
    const normalized = bucket.replace(/^Week of\s+/i, "");

    // Safely parse YYYY-MM-DD without timezone issues
    const [yearStr, monthStr, dayStr] = normalized.slice(0, 10).split("-");
    const year = Number(yearStr);
    const month = Number(monthStr); // 1–12
    const day = Number(dayStr);

    // Construct local Date (no UTC shift)
    const date = new Date(year, month - 1, day);

    if (Number.isNaN(date.getTime())) {
      console.warn("Invalid bucket date:", bucket);
      return bucket; // fallback
    }

    switch (groupBy) {
      case "week": {
        const start = startOfWeek(date, { weekStartsOn: 1 });
        const end = endOfWeek(date, { weekStartsOn: 1 });
        return `${format(start, "MMM d")} - ${format(end, "MMM d")}`;
      }
      case "day":
      default:
        return format(date, "MMM d");
    }
  }

  const handleDateRangeChange = (range: DateRange) => {
    onDateRangeChange(range);
  };

  const handleMarketingSourcesChange = (ids: string[]) => {
    onMarketingSourcesChange(ids);
  };

  return (
    <Card className="border-purple-200 border shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center space-x-4">
          <DateRangePicker
            dateRange={dateRange}
            onDateRangeChange={handleDateRangeChange}
            initialPreset='last30days'
            visiblePresets={[
              "last7days",
              "last30days",
              "last90days",
              "last180days",
              "thismonth",
              "lastmonth",
              "custom",
            ]}
          />
        </div>
        <div className="flex justify-between gap-2">
          {/* <Button className="bg-purple-600 hover:bg-purple-700 text-white">
            Filter By Marketing sources
          </Button> */}
          <MarketingSourceSelect
            values={marketingSourceIds}
            onChange={handleMarketingSourcesChange}
            placeholder="Filter by marketing sources"
            includeNoneOption={false}
          />
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex items-center justify-center space-x-8 mb-6">
          <div className="flex items-center space-x-2">
            <span className="bg-blue-200 border-[#2269f9] border-2 w-[35px] h-[15px]" />
            <Checkbox
              checked={showCalls}
              onCheckedChange={(checked) => setShowCalls(checked === true)}
              className="border-blue-400 data-[state=checked]:bg-blue-600 rounded-[0px]"
            />
            <span className="text-sm text-black font-medium">Calls</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="bg-green-200 border-green-400 border-2 w-[35px] h-[15px]" />
            <Checkbox
              checked={showMinutes}
              onCheckedChange={(checked) => setShowMinutes(checked === true)}
              className="border-blue-400 data-[state=checked]:bg-blue-600 rounded-[0px]"
            />
            <span className="text-sm text-black font-medium">Minutes</span>
          </div>
        </div>

        <div className="h-80 w-full">

          {(hasError || isLoading) ? (
            // <div className="flex flex-col items-center justify-center h-full text-md text-gray-500 gap-4"
            <div className={cn('flex flex-col items-center justify-center h-full text-lg gap-4', hasError ? 'text-destructive' : 'text-purple-500')}>
              <span>{hasError ? 'Failed to load chart. Please try again.' : 'Loading chart…'}</span>
              {
                isLoading && (
                  <Spinner
                    variant="purple-700"
                    track="purple-200"
                    label="Loading chart..."
                  />)
              }
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-full w-full">
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 20, left: 20, bottom: 10 }}
              >
                <CartesianGrid
                  stroke="#d1d5db"
                  strokeDasharray="2 2"
                  strokeWidth={2}
                />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  className="text-xs text-gray-950"
                />
                <YAxis
                  yAxisId="calls"
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={true}
                  className="text-xs text-gray-950"
                  orientation="left"
                />
                <YAxis
                  yAxisId="minutes"
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={true}
                  className="text-xs text-gray-950"
                  orientation="right"
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                {showCalls && (
                  <Line
                    type="monotone"
                    dataKey="calls"
                    stroke="#2269f9"
                    strokeWidth={2}
                    dot={{ fill: "#2269f9", strokeWidth: 2, r: 4 }}
                    yAxisId="calls"
                  />
                )}
                {showMinutes && (
                  <Line
                    type="monotone"
                    dataKey="minutes"
                    stroke="#05df72"
                    strokeWidth={2}
                    dot={{ fill: "#05df72", strokeWidth: 2, r: 4 }}
                    yAxisId="minutes"
                  />
                )}
              </LineChart>
            </ChartContainer>
          )}

        </div>
      </CardContent>
    </Card >
  );
}
