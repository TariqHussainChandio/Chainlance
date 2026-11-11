"use client";

import * as React from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';

import { GlassCard } from '@/components/ui/glass-card';
import { GradientText } from '@/components/ui/gradient-text';

interface DataPoint {
  date: string;
  revenue: number;
  fees: number;
  contracts: number;
}

interface RevenueChartProps {
  data?: DataPoint[];
  loading?: boolean;
  height?: number;
  type?: 'area' | 'bar';
}

const mockData: DataPoint[] = [
  { date: 'Jan', revenue: 4000, fees: 800, contracts: 12 },
  { date: 'Feb', revenue: 3000, fees: 600, contracts: 9 },
  { date: 'Mar', revenue: 5000, fees: 1000, contracts: 15 },
  { date: 'Apr', revenue: 4500, fees: 900, contracts: 13 },
  { date: 'May', revenue: 6000, fees: 1200, contracts: 18 },
  { date: 'Jun', revenue: 5500, fees: 1100, contracts: 16 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-[var(--glass-border)] rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium">{label}</p>
        {payload.map((item: any, index: number) => (
          <p key={index} className="text-sm text-foreground/70">
            {item.name}: ${item.value.toFixed(2)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function RevenueChart({ 
  data = mockData, 
  loading = false,
  height = 300,
  type = 'area'
}: RevenueChartProps) {
  if (loading) {
    return (
      <GlassCard className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 bg-foreground/10 rounded w-32 animate-pulse" />
          <div className="h-6 bg-foreground/10 rounded w-24 animate-pulse" />
        </div>
        <div className="h-[300px] bg-foreground/10 rounded animate-pulse" />
      </GlassCard>
    );
  }

  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
  const totalFees = data.reduce((sum, d) => sum + d.fees, 0);

  return (
    <GlassCard variant="elevated" className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm text-foreground/60">Revenue Overview</div>
          <div className="mt-1 text-2xl font-semibold">
            <GradientText>${totalRevenue.toFixed(2)}</GradientText>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-foreground/60">Platform Fees</div>
          <div className="mt-1 text-lg font-semibold text-purple-500">
            ${totalFees.toFixed(2)}
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        {type === 'area' ? (
          <AreaChart data={data}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--azure-500)" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="var(--azure-500)" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="feesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-foreground/10" />
            <XAxis 
              dataKey="date" 
              className="text-xs fill-foreground/60"
              tickLine={false}
            />
            <YAxis 
              className="text-xs fill-foreground/60"
              tickLine={false}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="revenue" 
              stroke="var(--azure-500)" 
              fill="url(#revenueGradient)"
              name="Revenue"
              strokeWidth={2}
            />
            <Area 
              type="monotone" 
              dataKey="fees" 
              stroke="#8b5cf6" 
              fill="url(#feesGradient)"
              name="Fees"
              strokeWidth={2}
            />
          </AreaChart>
        ) : (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-foreground/10" />
            <XAxis 
              dataKey="date" 
              className="text-xs fill-foreground/60"
              tickLine={false}
            />
            <YAxis 
              className="text-xs fill-foreground/60"
              tickLine={false}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar 
              dataKey="revenue" 
              fill="var(--azure-500)" 
              name="Revenue"
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              dataKey="fees" 
              fill="#8b5cf6" 
              name="Fees"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        )}
      </ResponsiveContainer>

      <div className="mt-4 pt-4 border-t border-[var(--glass-border)] flex justify-between text-xs text-foreground/50">
        <span>Total contracts: {data.reduce((sum, d) => sum + d.contracts, 0)}</span>
        <span>Last 6 months</span>
      </div>
    </GlassCard>
  );
}