'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, BarChart3, Settings } from 'lucide-react';
import { KpiCards } from './KpiCards';
import { RoiBarChart } from './RoiBarChart';
import { SuccessDonut } from './SuccessDonut';
import { TopPerformers } from './TopPerformers';
import { JobDataGrid } from './JobDataGrid';
import { ThemeToggle } from './ThemeToggle';
import { SettingsPanel } from './SettingsPanel';
import { Footer } from './Footer';
import { PeriodSelector } from './PeriodSelector';
import { TopProgressBar } from './TopProgressBar';
import { useDashboard } from '@/lib/dashboard-context';
import { periodToLabel } from '@/lib/types';
import type { DashboardData } from '@/lib/types';

export function Dashboard() {
  const { fteCost, period, setPeriod } = useDashboard();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [fetchError, setFetchError] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [monthOptions, setMonthOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    fetch('/api/months')
      .then((r) => r.json())
      .then((j) => setMonthOptions(j.months ?? []))
      .catch(() => {});
  }, []);

  const fetchData = useCallback(async (fte: number, p: string, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await fetch(`/api/dashboard?fte=${fte}&period=${p}`);
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error ?? 'fetch failed');
      setData(json);
      setFetchError(false);
      setLastUpdated(new Date());
    } catch {
      setFetchError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData(fteCost, period);
  }, [fteCost, period, fetchData]);

  const now = lastUpdated
    ? lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : '—';

  const periodLabel = periodToLabel(period);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      <TopProgressBar active={loading || refreshing} />

      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20">
              <BarChart3 className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 dark:text-white tracking-tight">
                BizOps DevOps ROI Dashboard
              </h1>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Updated {now}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <PeriodSelector
              value={period}
              onChange={setPeriod}
              monthOptions={monthOptions}
            />

            <button
              onClick={() => fetchData(fteCost, period, true)}
              disabled={refreshing}
              className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              title="Refresh data"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>

            <ThemeToggle />

            <button
              onClick={() => setSettingsOpen(true)}
              className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:text-cyan-600 dark:hover:text-cyan-400 hover:border-cyan-300 dark:hover:border-cyan-500/50 hover:bg-cyan-50 dark:hover:bg-cyan-500/10 transition-colors"
              title="Settings"
              aria-label="Open settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-screen-xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {loading ? (
          <LoadingSkeleton />
        ) : data ? (
          <div className={`space-y-8 transition-opacity duration-300 ${refreshing ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
            <KpiCards metrics={data.kpi} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <RoiBarChart
                  data={data.roiBuckets ?? data.monthlyRoi}
                  hourlyWage={fteCost / 2080}
                  periodLabel={periodLabel}
                  chartGroupLabel={data.chartGroupLabel}
                />
              </div>
              <SuccessDonut data={data.successRatio} />
            </div>
            <TopPerformers performers={data.topPerformers} />
            <JobDataGrid rows={data.jobTable} period={period} periodLabel={periodLabel} />
          </div>
        ) : (
          <div className="text-center py-24 text-gray-400">Failed to load dashboard data.</div>
        )}
      </main>

      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <Footer status={loading ? 'loading' : fetchError ? 'error' : 'ok'} />
    </div>
  );
}

// ─── Shimmer primitives ────────────────────────────────────────────────────────

function S({ className, style }: { className: string; style?: React.CSSProperties }) {
  return <div className={`shimmer rounded-lg ${className}`} style={style} />;
}

// ─── Skeleton sections ────────────────────────────────────────────────────────

function KpiSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <S className="h-3.5 w-24" />
            <S className="h-6 w-6 rounded-full" />
          </div>
          <S className="h-8 w-28" />
          <S className="h-3 w-16" />
        </div>
      ))}
    </div>
  );
}

function BarChartSkeleton() {
  const bars = [55, 80, 45, 90, 65, 75, 40];
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <S className="h-4 w-36" />
        <S className="h-3 w-20" />
      </div>
      <div className="flex items-end gap-3 h-44 pt-4">
        {bars.map((h, i) => (
          <div key={i} className="flex-1 flex flex-col justify-end gap-1">
            <S className={`w-full rounded-md`} style={{ height: `${h}%` } as React.CSSProperties} />
          </div>
        ))}
      </div>
      <div className="flex gap-3">
        {bars.map((_, i) => <S key={i} className="flex-1 h-3" />)}
      </div>
    </div>
  );
}

function DonutSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50 p-6 flex flex-col items-center gap-6">
      <S className="h-4 w-32" />
      <div className="relative w-40 h-40">
        <S className="w-full h-full rounded-full" />
        <div className="absolute inset-6 rounded-full bg-white dark:bg-gray-900" />
      </div>
      <div className="w-full space-y-2">
        {[70, 50, 40].map((w, i) => (
          <div key={i} className="flex items-center gap-2">
            <S className="h-3 w-3 rounded-full shrink-0" />
            <S className={`h-3`} style={{ width: `${w}%` } as React.CSSProperties} />
          </div>
        ))}
      </div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50 overflow-hidden">
      {/* table header */}
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
        <div className="space-y-1.5">
          <S className="h-4 w-44" />
          <S className="h-3 w-28" />
        </div>
        <S className="h-9 w-52 rounded-xl" />
      </div>
      {/* column headers */}
      <div className="px-6 py-3 border-b border-gray-100 dark:border-gray-700/60 grid grid-cols-7 gap-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <S key={i} className="h-3" />
        ))}
      </div>
      {/* rows */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="px-6 py-3.5 border-b border-gray-50 dark:border-gray-800/80 last:border-0 grid grid-cols-7 gap-4 items-center">
          <S className="h-3 col-span-2" style={{ width: `${60 + (i * 13) % 40}%` } as React.CSSProperties} />
          <S className="h-5 w-20 rounded-full" />
          {Array.from({ length: 4 }).map((_, j) => (
            <S key={j} className="h-3" style={{ width: `${50 + (j * 17) % 40}%` } as React.CSSProperties} />
          ))}
        </div>
      ))}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      <KpiSkeleton />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <BarChartSkeleton />
        </div>
        <DonutSkeleton />
      </div>
      <TableSkeleton />
    </div>
  );
}

