"use client"

import { MetricCard } from '@/app/(main)/home/components/MetricsCard';
import { ChartCard } from '@/app/(main)/home/components/ChartCard'
import { PhoneIcon, ClockIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';

const Home = () => {
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
            value={0}
            change="0%"
            icon={<PhoneIcon className="h-6 w-6 text-purple-600" />}
          />
          <MetricCard
            title="Calls Last 7 Days"
            value={0}
            change="0%"
            icon={<PhoneIcon className="h-6 w-6 text-purple-600" />}
          />
          <MetricCard
            title="Calls last 30 Days"
            value={0}
            change="0%"
            icon={<PhoneIcon className="h-6 w-6 text-purple-600" />}
          />
        </div>

        {/* Chart Section */}
        <ChartCard />

        {/* Bottom Row - Minutes Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard
            title="Minutes Today"
            value={0}
            change="0%"
            icon={<ClockIcon className="h-6 w-6 text-purple-600" />}
          />
          <MetricCard
            title="Minutes Last 7 Days"
            value={0}
            change="0%"
            icon={<ClockIcon className="h-6 w-6 text-purple-600" />}
          />
          <MetricCard
            title="Minutes Last 30 Days"
            value={0}
            change="0%"
            icon={<ClockIcon className="h-6 w-6 text-purple-600" />}
          />
        </div>
      </div>
    </div>
  );
}

export default Home;