'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { SuccessRatioData } from '@/lib/types';

interface SuccessDonutProps {
  data: SuccessRatioData[];
}

function CustomTooltip({ active, payload, isDark }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  const total = d.payload.total as number;
  const pct = ((d.value / total) * 100).toFixed(1);
  return (
    <div
      className={`rounded-lg border px-4 py-3 text-sm shadow-xl ${
        isDark
          ? 'border-gray-700 bg-gray-900 text-white'
          : 'border-gray-200 bg-white text-gray-900'
      }`}
    >
      <p className="font-semibold mb-1" style={{ color: d.payload.fill }}>
        {d.name}
      </p>
      <p>{d.value.toLocaleString('en-US')} executions</p>
      <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>{pct}% of total</p>
    </div>
  );
}

function CustomLegend({ payload, isDark }: any) {
  return (
    <div className="flex justify-center gap-6 mt-4">
      {payload.map((entry: any) => (
        <div key={entry.value} className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full" style={{ background: entry.color }} />
          <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export function SuccessDonut({ data }: SuccessDonutProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === 'dark';

  // Adjust fill colors per theme: cyan in dark, teal in light; rose stays
  const themed = data.map((d) => ({
    ...d,
    fill: d.name === 'Success'
      ? (isDark ? '#22d3ee' : '#0891b2')
      : (isDark ? '#f43f5e' : '#e11d48'),
  }));

  const total = themed.reduce((s, d) => s + d.value, 0);
  const enriched = themed.map((d) => ({ ...d, total }));
  const successItem = themed.find((d) => d.name === 'Success');
  const pct = total > 0 && successItem ? ((successItem.value / total) * 100).toFixed(1) : '0';

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm dark:shadow-none p-6">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1">
        Execution Success Ratio
      </h2>
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">All-time execution outcomes</p>
      <div className="relative">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={enriched}
              cx="50%"
              cy="50%"
              innerRadius={72}
              outerRadius={100}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {enriched.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip content={(props) => <CustomTooltip {...props} isDark={isDark} />} />
            <Legend content={(props) => <CustomLegend {...props} isDark={isDark} />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{pct}%</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Success</p>
        </div>
      </div>
    </div>
  );
}
