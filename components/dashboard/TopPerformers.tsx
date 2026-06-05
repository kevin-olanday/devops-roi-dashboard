'use client';

import { Trophy } from 'lucide-react';
import { InfoTooltip } from './InfoTooltip';
import type { TopPerformer } from '@/lib/types';

const SOURCE_COLORS: Record<string, string> = {
  'Control-M':
    'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-500/20 dark:text-sky-300 dark:border-sky-500/30',
  'Power Automate':
    'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30',
  Jenkins:
    'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/20 dark:text-orange-300 dark:border-orange-500/30',
  default:
    'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600',
};

const MEDAL_COLORS = [
  'text-amber-500',
  'text-gray-400 dark:text-gray-300',
  'text-amber-700 dark:text-amber-600',
  'text-gray-400',
  'text-gray-400',
];

function fmtCurrency(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

interface TopPerformersProps {
  performers: TopPerformer[];
}

export function TopPerformers({ performers }: TopPerformersProps) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm dark:shadow-none p-6">
      <div className="flex items-center gap-2 mb-1">
        <Trophy className="w-4 h-4 text-amber-500" />
        <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
          Top 5 Performers
        </h2>
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-5">Ranked by total financial savings</p>
      <div className="space-y-2">
        {performers.map((p, i) => {
          const colorClass = SOURCE_COLORS[p.sourceSystem] ?? SOURCE_COLORS.default;
          return (
            <div
              key={p.id}
              className="flex items-center gap-4 rounded-lg border border-gray-100 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-900/50 px-4 py-3 transition-colors hover:bg-gray-100 dark:hover:bg-gray-900/80"
            >
              <span className={`text-lg font-black w-6 text-center tabular-nums ${MEDAL_COLORS[i]}`}>
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <span className="inline-flex items-center gap-1.5">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{p.name}</p>
                  {p.description && <InfoTooltip text={p.description} />}
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span
                  className={`hidden sm:inline-flex text-xs font-medium px-2 py-0.5 rounded-full border ${colorClass}`}
                >
                  {p.sourceSystem}
                </span>
                <div className="text-right">
                  <p className="text-sm font-bold text-cyan-600 dark:text-cyan-400 tabular-nums">
                    {fmtCurrency(p.financialSavings)}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 tabular-nums">
                    {p.hoursSaved.toFixed(0)} hrs
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
