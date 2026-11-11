"use client";

import * as React from 'react';
import { 
  BarChart3, 
  Download, 
  Calendar,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';

import { AdminStats } from '@/components/admin/admin-stats';
import { RevenueChart } from '@/components/admin/revenue-chart';
import { FeeAnalytics } from '@/components/admin/fee-analytics';
import { RecentTransactions } from '@/components/admin/recent-transactions';
import { GlassCard } from '@/components/ui/glass-card';
import { AzureButton } from '@/components/ui/azure-button';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

import { buildCsvString, downloadCsv } from '@/lib/utils/csv-export';

export default function AdminAnalyticsPage() {
  const [timeRange, setTimeRange] = React.useState('30d');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, [timeRange]);

  const handleExport = () => {
    const headers = ["Metric", "Value", "Time Period", "Description"];
    const rows = [
      ["Average Transaction Value", "$247.50", timeRange, "Platform average across contracts"],
      ["Transaction Success Rate", "98.7%", timeRange, "Percentage of non-disputed transactions"],
      ["Active Users", "847", timeRange, "Total active freelancers & clients"],
      ["Pending Disputes", "3", timeRange, "Open dispute resolution cases"],
      ["Zero Fee Escrow Model", "Active ($0)", timeRange, "Smart contract escrow policy"],
    ];
    const csv = buildCsvString(headers, rows);
    downloadCsv(`chainwork-analytics-${timeRange}-${Date.now()}.csv`, csv);
    toast.success("Analytics metrics exported to CSV.");
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="inline-flex items-center gap-2 text-3xl font-semibold tracking-tight">
            <BarChart3 className="size-7 text-[color:var(--azure-500)]" />
            Analytics
          </h1>
          <p className="mt-1 text-sm text-foreground/60">
            Platform metrics, revenue trends, and fee analytics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="min-w-[10rem]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExport}>
            <Download className="size-3.5" />
            Export
          </Button>
        </div>
      </div>

      <AdminStats loading={loading} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart loading={loading} />
        </div>
        <div className="lg:col-span-1">
          <FeeAnalytics loading={loading} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentTransactions loading={loading} limit={5} />
        <GlassCard className="p-5">
          <h3 className="text-sm font-semibold mb-4">Quick Stats</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 rounded-lg bg-[color:var(--azure-500)]/5">
              <span className="text-sm text-foreground/70">Avg. Transaction Value</span>
              <span className="font-semibold">$247.50</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-emerald-500/5">
              <span className="text-sm text-foreground/70">Success Rate</span>
              <span className="font-semibold text-emerald-500">98.7%</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-purple-500/5">
              <span className="text-sm text-foreground/70">Active Users</span>
              <span className="font-semibold text-purple-500">847</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-amber-500/5">
              <span className="text-sm text-foreground/70">Pending Disputes</span>
              <span className="font-semibold text-amber-500">3</span>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}