'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MomBadgeProps {
  value: number;
  suffix?: string;
}

export function MomBadge({ value, suffix = '%' }: MomBadgeProps) {
  const rounded = Math.round(value * 10) / 10;
  const isPositive = rounded > 0;
  const isNeutral = rounded === 0;

  if (isNeutral) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 font-medium">
        <Minus className="w-3 h-3" />
        0{suffix} MoM
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-semibold ${
        isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'
      }`}
    >
      {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {isPositive ? '+' : ''}
      {rounded}
      {suffix} MoM
    </span>
  );
}
