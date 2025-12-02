// app/(main)/home/components/MetricsCard.tsx
"use client";

import { ReactNode, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";


import { formatNumberFixed } from "@/lib/utils";

type MetricCardProps = {
  title: string;
  value: number;
  changePercent: number; // raw number from backend, can be negative
  icon: ReactNode;
  isLoading?: boolean;
};

export const MetricCard = ({
  title,
  value,
  changePercent,
  icon,
  isLoading,
}: MetricCardProps) => {
  const { formattedChange, trendColor, TrendIcon, bgBadge } = useMemo(() => {
    const isPositive = changePercent > 0;
    const isNegative = changePercent < 0;

    const formatted =
      (isPositive ? "+" : "") + changePercent.toFixed(1) + "%";

    if (isPositive) {
      return {
        formattedChange: formatted,
        trendColor: "text-emerald-600",
        bgBadge: "bg-emerald-50",
        TrendIcon: ArrowUpRight,
      };
    }

    if (isNegative) {
      return {
        formattedChange: formatted, // will include "-" from number
        trendColor: "text-red-600",
        bgBadge: "bg-red-50",
        TrendIcon: ArrowDownRight,
      };
    }

    // zero / no change
    return {
      formattedChange: "0.0%",
      trendColor: "text-gray-500",
      bgBadge: "bg-gray-100",
      TrendIcon: Minus,
    };
  }, [changePercent]);

  return (
    <Card className="border border-purple-200 shadow-sm h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-md font-medium text-gray-600">
          {title}
        </CardTitle>
        <div className="rounded-full bg-purple-100 p-2">{icon}</div>
      </CardHeader>
      <CardContent className="flex items-end justify-between p-5">
        <div>
          <p className="text-3xl font-semibold text-gray-900">
            {isLoading ? "–" : formatNumberFixed(value)}
          </p>
        </div>
        <div
          className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${bgBadge} ${trendColor}`}
        >
          <TrendIcon className="h-3 w-3" />
          <span>{isLoading ? "…" : formattedChange}</span>
        </div>
      </CardContent>
    </Card>
  );
};
