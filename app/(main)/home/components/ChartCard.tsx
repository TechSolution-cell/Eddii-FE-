import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { DateRangePicker, DateRange } from '@/components/DateRangePicker';
import { subDays, startOfDay, endOfDay } from 'date-fns';

const chartData = [
  { name: 'March 8', calls: 2, minutes: 1.2 },
  { name: 'April 7', calls: 4, minutes: 2.5 },
  { name: 'May 7', calls: 1, minutes: 0.8 },
  { name: 'June 6', calls: 6, minutes: 3.1 },
  { name: 'July 6', calls: 3, minutes: 1.9 },
  { name: 'August 5', calls: 5, minutes: 2.7 },
];

const chartConfig = {
  calls: {
    label: 'Calls',
    color: '#2269f9',
  },
  minutes: {
    label: 'Minutes',
    color: '#05df72',
  },
};

export function ChartCard() {
  const [showCalls, setShowCalls] = useState(true);
  const [showMinutes, setShowMinutes] = useState(true);

  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfDay(subDays(new Date(), 29)),
    to: endOfDay(new Date())
  });


  // Handle changes to the selected date range.
  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range);
    // setCurrentPage(1); // Reset to first page when changing date range
  };


  return (
    <Card className="border-purple-200 border shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center space-x-4">
          {/* <Badge className="bg-purple-600 text-white px-3 py-1">
            📅 03/08/2025 - 09/03/2025
          </Badge> */}
          <DateRangePicker
            dateRange={dateRange}
            onDateRangeChange={handleDateRangeChange}
            visiblePresets={["last7days", "last30days", "last90days", "last180days", "thismonth", "lastmonth", "custom"]}
          />
        </div>
        <div className='flex justify-between gap-2'>
          <Button className="bg-purple-600 hover:bg-purple-700 text-white">
            Filter By Marketing sources
          </Button>
          {/* <Button className="bg-purple-600 hover:bg-purple-700 text-white">
            Filter By Numbers
          </Button> */}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center space-x-8 mb-6">
          <div className="flex items-center space-x-2">
            <span className='bg-blue-200 border-[#2269f9] border-2 w-[35px] h-[15px]' />
            <Checkbox
              checked={showCalls}
              onCheckedChange={(checked) => setShowCalls(checked === true)}
              className="border-blue-400 data-[state=checked]:bg-blue-600 rounded-[0px]"
            />
            <span className="text-sm text-black font-medium">Calls</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className='bg-green-200 border-green-400 border-2 w-[35px] h-[15px]' />
            <Checkbox
              checked={showMinutes}
              onCheckedChange={(checked) => setShowMinutes(checked === true)}
              className="border-blue-400 data-[state=checked]:bg-blue-600 rounded-[0px]"
            />
            <span className="text-sm text-black font-medium">Minutes</span>
          </div>
        </div>
        <div className="h-80 w-full">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 20, left: 20, bottom: 10 }}
            >
              <CartesianGrid stroke="#d1d5db" strokeDasharray="1 1" strokeWidth={2} />
              {/* <CartesianGrid stroke="#d1d5db" strokeDasharray="3 3" /> */}
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
                className="text-xs text-gray-950"
                orientation="left"
              />
              <YAxis
                yAxisId="minutes"
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
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
                  dot={{ fill: '#2269f9', strokeWidth: 2, r: 4 }}
                  yAxisId="calls"
                />
              )}
              {showMinutes && (
                <Line
                  type="monotone"
                  dataKey="minutes"
                  stroke="#05df72"
                  strokeWidth={2}
                  dot={{ fill: '#05df72', strokeWidth: 2, r: 4 }}
                  yAxisId="minutes"
                />
              )}
            </LineChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
