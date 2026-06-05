'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { RoiBucket } from '@/lib/types';

interface RoiBarChartProps {
  data: RoiBucket[];
  hourlyWage: number;
  periodLabel: string;
  chartGroupLabel: string;
}

/** Least-squares linear regression over an array of values. Returns fitted y for each x. */
function linearTrend(values: number[]): number[] {
  const n = values.length;
  if (n < 2) return values.slice();
  const meanX = (n - 1) / 2;
  const meanY = values.reduce((a, b) => a + b, 0) / n;
  const num = values.reduce((s, v, i) => s + (i - meanX) * (v - meanY), 0);
  const den = values.reduce((s, _, i) => s + (i - meanX) ** 2, 0);
  const slope = den !== 0 ? num / den : 0;
  const intercept = meanY - slope * meanX;
  return values.map((_, i) => Math.max(0, Math.round(intercept + slope * i)));
}

interface ChartPoint extends RoiBucket {
  trendValue: number;
}

function CustomTooltip({ active, payload, label, isDark }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as ChartPoint | undefined;
  if (!d) return null;

  return (
    <div
      className={`rounded-lg border px-4 py-3 text-sm shadow-xl ${
        isDark ? 'border-gray-700 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-900'
      }`}
    >
      <p className="font-semibold text-cyan-600 dark:text-cyan-400 mb-2">{label}</p>
      <p className="tabular-nums">${d.financialSavings.toLocaleString('en-US')} saved</p>
      <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        {d.hoursSaved.toFixed(1)} hrs · {d.executions} runs
      </p>
      <p className={`text-xs mt-1.5 font-medium ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
        Trend: ${d.trendValue.toLocaleString('en-US')}
      </p>
    </div>
  );
}

function CustomLegend({ isDark }: { isDark: boolean }) {
  return (
    <div className="flex items-center justify-end gap-5 mb-4">
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-sm" style={{ background: isDark ? '#22d3ee' : '#0891b2' }} />
        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Actual Savings</span>
      </div>
      <div className="flex items-center gap-1.5">
        <svg width="20" height="12" className="shrink-0">
          <line
            x1="0" y1="6" x2="20" y2="6"
            stroke={isDark ? '#f59e0b' : '#d97706'}
            strokeWidth="2"
            strokeDasharray="4 3"
          />
        </svg>
        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Projected Trajectory</span>
      </div>
    </div>
  );
}

export function RoiBarChart({ data, periodLabel, chartGroupLabel }: RoiBarChartProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === 'dark';
  const gridColor = isDark ? '#374151' : '#e5e7eb';
  const tickColor = isDark ? '#9ca3af' : '#6b7280';
  const barColor = isDark ? '#22d3ee' : '#0891b2';
  const trendColor = isDark ? '#f59e0b' : '#d97706';

  const trendValues = linearTrend(data.map((d) => d.financialSavings));
  const chartData: ChartPoint[] = data.map((bucket, i) => ({
    ...bucket,
    trendValue: trendValues[i],
  }));

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm dark:shadow-none p-6">
      <div className="flex items-start justify-between mb-1">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
          Financial ROI — {periodLabel}
        </h2>
        <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">{chartGroupLabel}</span>
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-5">
        Estimated cost avoidance based on successful runs
      </p>

      <CustomLegend isDark={isDark} />

      <ResponsiveContainer width="100%" height={240}>
        <ComposedChart data={chartData} margin={{ top: 4, right: 8, left: 8, bottom: 0 }} barCategoryGap="30%">
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: tickColor, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: tickColor, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
            width={52}
          />
          <Tooltip
            content={(props) => <CustomTooltip {...props} isDark={isDark} />}
            cursor={{ fill: isDark ? 'rgba(34,211,238,0.05)' : 'rgba(8,145,178,0.05)' }}
          />
          <Bar
            dataKey="financialSavings"
            name="Actual Savings"
            fill={barColor}
            radius={[4, 4, 0, 0]}
            maxBarSize={60}
          />
          <Line
            type="monotone"
            dataKey="trendValue"
            name="Projected Trajectory"
            stroke={trendColor}
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            activeDot={{ r: 4, fill: trendColor, stroke: isDark ? '#1f2937' : '#fff', strokeWidth: 2 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
