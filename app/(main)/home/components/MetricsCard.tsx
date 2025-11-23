import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ReactNode } from 'react';

interface MetricCardProps {
  title: string;
  value: number;
  change: string;
  icon: ReactNode;
}

export function MetricCard({ title, value, change, icon }: MetricCardProps) {
  return (
    <Card className="border-purple-200 border bg-gradient-to-br from-white to-purple-50 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm text-gray-600">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
              ↑ {change}
            </Badge>
          </div>
          <div className="p-3 rounded-lg bg-purple-100">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
