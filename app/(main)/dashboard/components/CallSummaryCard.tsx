// app/(main)/home/components/CallSummaryCard.tsx
"use client";

import { memo, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    ArrowUpRight,
    ArrowDownRight,
    Minus,
    Star,
    TrendingUp,
    Wrench,
} from "lucide-react";
import { formatNumberFixed } from "@/lib/utils";
import type { CallSummaryKpis } from "@/types";

type CallSummaryCardProps = {
    title: string;
    departmentLabel: string; // "Sales" | "Service"
    metrics: CallSummaryKpis;
    isLoading?: boolean;
};

export const CallSummaryCard = memo(function CallSummaryCard({
    title,
    departmentLabel,
    metrics,
    isLoading,
}: CallSummaryCardProps) {
    const {
        totalCalls,
        connectedCalls,
        requestedAppointments,
        bookedAppointments,
        conversationRatePercent,
        bookingRatePercent,
        avgSentiment,
    } = metrics;

    // Up/down/flat trend for totalCalls
    const { formattedChange, trendColor, TrendIcon, bgBadge } = useMemo(() => {
        const pct = totalCalls.changePercent ?? 0;
        const isPositive = pct > 0;
        const isNegative = pct < 0;

        const formatted =
            (isPositive ? "+" : "") + pct.toFixed(1) + "%";

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
                formattedChange: formatted, // includes "-"
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
    }, [totalCalls.changePercent]);

    // Badge styling + icon based on department
    const { badgeBg, badgeText, BadgeIcon } = useMemo(() => {
        const key = departmentLabel.toLowerCase();

        if (key === "sales") {
            return {
                badgeBg: "bg-purple-100",
                badgeText: "text-purple-700",
                BadgeIcon: TrendingUp,
            };
        }

        if (key === "service") {
            return {
                badgeBg: "bg-blue-100",
                badgeText: "text-blue-700",
                BadgeIcon: Wrench,
            };
        }

        // fallback
        return {
            badgeBg: "bg-gray-100",
            badgeText: "text-gray-700",
            BadgeIcon: Minus,
        };
    }, [departmentLabel]);

    const sentimentStars = useMemo(() => {
        const value = Math.max(0, Math.min(5, avgSentiment ?? 0));

        return Array.from({ length: 5 }, (_, index) => {
            const filled = index < value;
            return (
                <Star
                    key={index}
                    className={
                        filled
                            ? "h-4 w-4 text-yellow-500 fill-yellow-500"
                            : "h-4 w-4 text-gray-300 fill-gray-200"
                    }
                />
            );
        });
    }, [avgSentiment]);

    const formatCount = (val: number | null | undefined) =>
        isLoading ? "–" : formatNumberFixed(val ?? 0);

    const formatPercent = (val: number | null | undefined) =>
        isLoading ? "–" : `${(val ?? 0).toFixed(0)}%`;

    return (
        <Card className="border border-purple-200 shadow-sm h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-md font-medium text-gray-600">
                    {title}
                </CardTitle>

                {/* Department badge with icon */}
                <div
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${badgeBg} ${badgeText}`}
                >
                    <BadgeIcon className="h-3.5 w-3.5" />
                    <span>{departmentLabel}</span>
                </div>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
                {/* Top row: total + change pill (same vibe as MetricCard) */}
                <div className="flex items-end justify-between">
                    <div>
                        <p className="text-xs text-purple-500 mb-1">Total calls</p>
                        <p className="text-3xl font-semibold text-purple-900">
                            {isLoading ? "–" : formatNumberFixed(totalCalls.value)}
                        </p>
                    </div>
                    <div
                        className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${bgBadge} ${trendColor}`}
                    >
                        <TrendIcon className="h-3 w-3" />
                        <span>{isLoading ? "…" : formattedChange}</span>
                    </div>
                </div>

                {/* Middle metrics grid */}
                <div className="grid grid-cols-2 gap-y-2 text-sm text-purple-800">
                    <div className="flex items-center justify-between pr-3">
                        <span className="text-purple-500">Connected</span>
                        <span className="font-medium">
                            {formatCount(connectedCalls)}
                        </span>
                    </div>

                    <div className="flex items-center justify-between pl-3">
                        <span className="text-purple-500">Requested appts</span>
                        <span className="font-medium">
                            {formatCount(requestedAppointments)}
                        </span>
                    </div>

                    <div className="flex items-center justify-between pr-3">
                        <span className="text-purple-500">Set appts</span>
                        <span className="font-medium">
                            {formatCount(bookedAppointments)}
                        </span>
                    </div>

                    <div className="flex items-center justify-between pl-3">
                        <span className="text-purple-500">Conversation rate</span>
                        <span className="font-medium">
                            {formatPercent(conversationRatePercent)}
                        </span>
                    </div>

                    <div className="flex items-center justify-between pr-3">
                        <span className="text-purple-500">Booking rate</span>
                        <span className="font-medium">
                            {formatPercent(bookingRatePercent)}
                        </span>
                    </div>

                </div>

                {/* Sentiment footer */}
                <div className="flex items-center justify-between pt-3 border-t border-purple-100">
                    <span className="text-xs text-purple-500">
                        Overall sentiment
                    </span>
                    <div className="flex items-center gap-1">
                        {isLoading ? (
                            <span className="text-purple-400 text-xs">–</span>
                        ) : (
                            sentimentStars
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
});
