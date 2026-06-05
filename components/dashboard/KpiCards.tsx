'use client';

import { Bot, CheckCircle, Clock, DollarSign } from 'lucide-react';
import { MomBadge } from './MomBadge';
import { InfoTooltip } from './InfoTooltip';
import type { KpiMetrics } from '@/lib/types';

function fmt(n: number, decimals = 0) {
  return n.toLocaleString('en-US', { maximumFractionDigits: decimals });
}

function fmtCurrency(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${fmt(n)}`;
}

interface KpiCardsProps {
  metrics: KpiMetrics;
}

export function KpiCards({ metrics }: KpiCardsProps) {
  const p = metrics.periodLabel;

  const eoyLabel =
    metrics.eoyProjectedSavings !== null
      ? `EOY Projection: ${fmtCurrency(metrics.eoyProjectedSavings)}`
      : 'EOY Projection: insufficient data';

  const cards = [
    {
      label: 'Total Automated Jobs',
      value: fmt(metrics.totalJobs),
      sub: 'All active automations',
      subDetail: null as string | null,
      mom: metrics.totalJobsMoM,
      icon: Bot,
      iconBg: 'bg-cyan-50 dark:bg-cyan-500/10',
      iconBorder: 'border-cyan-200 dark:border-cyan-500/20',
      iconColor: 'text-cyan-600 dark:text-cyan-400',
      accentBar: 'bg-cyan-500',
      tooltip: null as string | null,
    },
    {
      label: 'Avg. Success Rate',
      value: `${fmt(metrics.avgSuccessRate, 1)}%`,
      sub: p,
      subDetail: null,
      mom: metrics.avgSuccessRateMoM,
      icon: CheckCircle,
      iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',
      iconBorder: 'border-emerald-200 dark:border-emerald-500/20',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      accentBar: 'bg-emerald-500',
      tooltip: null,
    },
    {
      label: 'Engineering Capacity Reclaimed',
      value: fmt(metrics.totalHoursSaved, 0),
      sub: `${p} · hours saved`,
      subDetail: `Equivalent to ${metrics.ftesReclaimed.toFixed(2)} FTEs reallocated`,
      mom: metrics.totalHoursSavedMoM,
      icon: Clock,
      iconBg: 'bg-sky-50 dark:bg-sky-500/10',
      iconBorder: 'border-sky-200 dark:border-sky-500/20',
      iconColor: 'text-sky-600 dark:text-sky-400',
      accentBar: 'bg-sky-500',
      tooltip: null,
    },
    {
      label: 'Financial Value & Forecast',
      value: fmtCurrency(metrics.totalFinancialSavings),
      sub: p,
      subDetail: eoyLabel,
      mom: metrics.totalFinancialSavingsMoM,
      icon: DollarSign,
      iconBg: 'bg-amber-50 dark:bg-amber-500/10',
      iconBorder: 'border-amber-200 dark:border-amber-500/20',
      iconColor: 'text-amber-600 dark:text-amber-400',
      accentBar: 'bg-amber-500',
      tooltip: 'EOY projection is based on the 30-day moving average daily run rate × 365. Requires at least 7 days of historical data.',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm dark:shadow-none p-5 flex flex-col gap-3"
          >
            <div className={`absolute top-0 left-0 right-0 h-0.5 ${card.accentBar}`} />

            <div className="flex items-start justify-between">
              <div className="flex items-center gap-1.5 pr-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400 leading-tight">
                  {card.label}
                </p>
                {card.tooltip && <InfoTooltip text={card.tooltip} />}
              </div>
              <div className={`p-1.5 rounded-lg border ${card.iconBg} ${card.iconBorder} shrink-0`}>
                <Icon className={`w-3.5 h-3.5 ${card.iconColor}`} />
              </div>
            </div>

            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">
                {card.value}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{card.sub}</p>
              {card.subDetail && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 font-medium">
                  {card.subDetail}
                </p>
              )}
            </div>

            <MomBadge value={card.mom} />
          </div>
        );
      })}
    </div>
  );
}
