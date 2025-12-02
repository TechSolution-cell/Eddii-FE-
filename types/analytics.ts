export type MetricWithChange = {
    value: number;
    changePercent: number;
};

export type SummaryMetrics = {
    callsToday: MetricWithChange;
    callsLast7Days: MetricWithChange;
    callsLast30Days: MetricWithChange;
    minutesToday: MetricWithChange;
    minutesLast7Days: MetricWithChange;
    minutesLast30Days: MetricWithChange;
};

export type ChartPointDto = {
    bucket: string; // ISO date string
    calls: number;
    minutes: number;
};

export type DashboardResponse = {
    summary: SummaryMetrics;
    chart: {
        groupBy: DateGrouping;
        from: string;
        to: string;
        points: ChartPointDto[];
    };
};

export type DateGrouping = 'day' | 'week' | 'month';