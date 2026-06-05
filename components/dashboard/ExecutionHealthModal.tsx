'use client';

import { useEffect, useState, useCallback } from 'react';
import { X, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import type { JobHealthData, DaySummary, RecentFailure } from '@/lib/types';

interface Props {
  jobId: string | null;
  period: string;
  onClose: () => void;
}

export function ExecutionHealthModal({ jobId, period, onClose }: Props) {
  const [data, setData] = useState<JobHealthData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchHealth = useCallback(async (id: string, p: string) => {
    setLoading(true);
    setData(null);
    try {
      const res = await fetch(`/api/job-health?jobId=${encodeURIComponent(id)}&period=${encodeURIComponent(p)}`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (jobId) fetchHealth(jobId, period);
  }, [jobId, period, fetchHealth]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const visible = !!jobId;

  const rateColor = data
    ? data.aggregateSuccessRate >= 95
      ? 'text-emerald-500 dark:text-emerald-400'
      : data.aggregateSuccessRate >= 85
      ? 'text-amber-500 dark:text-amber-400'
      : 'text-rose-500 dark:text-rose-400'
    : '';

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[150] bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div
        className={`fixed top-0 right-0 bottom-0 z-[160] w-full sm:w-[560px] flex flex-col bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-2xl transition-transform duration-300 ease-out ${
          visible ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="shrink-0 flex items-start justify-between gap-4 px-6 py-5 border-b border-gray-200 dark:border-gray-800">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1">
              Execution Health
            </p>
            <h2 className="text-base font-bold text-gray-900 dark:text-white truncate leading-snug">
              {loading ? <span className="shimmer rounded inline-block w-48 h-5" /> : (data?.jobName ?? '—')}
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {loading ? <span className="shimmer rounded inline-block w-32 h-3" /> : (
                data ? `${data.periodLabel} · ${data.totalRuns} run${data.totalRuns !== 1 ? 's' : ''}` : ''
              )}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 mt-1">
            {!loading && data && (
              <div className="text-right">
                <p className={`text-2xl font-bold tabular-nums leading-none ${rateColor}`}>
                  {data.aggregateSuccessRate.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">success rate</p>
              </div>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Close panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-7">
          {loading ? (
            <PanelSkeleton />
          ) : data ? (
            <>
              <ActivityGrid days={data.days} />

              {data.recentFailures.length > 0 ? (
                <FailuresLog failures={data.recentFailures} />
              ) : (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <p className="text-sm text-emerald-700 dark:text-emerald-400">
                    No failures recorded in this period.
                  </p>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}

// ─── Activity Grid ────────────────────────────────────────────────────────────

function dayColor(day: DaySummary): string {
  if (day.successes === 0 && day.failures === 0)
    return 'bg-gray-100 dark:bg-gray-800';
  if (day.failures > 0)
    return 'bg-rose-400 dark:bg-rose-500';
  return 'bg-emerald-400 dark:bg-emerald-500';
}

function dayTitle(day: DaySummary): string {
  // Parse YYYY-MM-DD safely without timezone shift
  const [year, month, d] = day.date.split('-').map(Number);
  const formatted = new Date(year, month - 1, d).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });
  if (day.successes === 0 && day.failures === 0) return `${formatted}: No runs`;
  const parts: string[] = [];
  if (day.successes > 0) parts.push(`${day.successes} Success${day.successes !== 1 ? 'es' : ''}`);
  if (day.failures > 0) parts.push(`${day.failures} Failure${day.failures !== 1 ? 's' : ''}`);
  return `${formatted}: ${parts.join(', ')}`;
}

function ActivityGrid({ days }: { days: DaySummary[] }) {
  // Chunk into rows of 7 (week rows)
  const rows: DaySummary[][] = [];
  for (let i = 0; i < days.length; i += 7) rows.push(days.slice(i, i + 7));

  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
        Daily Activity
      </h3>

      <div className="space-y-1">
        {rows.map((row, ri) => (
          <div key={ri} className="flex gap-1">
            {row.map((day) => (
              <div
                key={day.date}
                title={dayTitle(day)}
                className={`w-5 h-5 rounded-[3px] shrink-0 cursor-default transition-opacity hover:opacity-80 ${dayColor(day)}`}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 mt-3">
        <LegendDot color="bg-emerald-400 dark:bg-emerald-500" label="All success" />
        <LegendDot color="bg-rose-400 dark:bg-rose-500" label="Has failures" />
        <LegendDot color="bg-gray-100 dark:bg-gray-800" label="No runs" />
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-3 h-3 rounded-sm ${color}`} />
      <span className="text-xs text-gray-400 dark:text-gray-500">{label}</span>
    </div>
  );
}

// ─── Failures Log ─────────────────────────────────────────────────────────────

function FailuresLog({ failures }: { failures: RecentFailure[] }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
        <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
          Recent Failures
        </h3>
      </div>

      <div className="space-y-2">
        {failures.map((f) => {
          const dt = new Date(f.executedAt);
          const dateStr = dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          const timeStr = dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
          const mins = Math.floor(f.durationSeconds / 60);
          const secs = f.durationSeconds % 60;
          const duration = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

          return (
            <div
              key={f.id}
              className="rounded-xl border border-rose-100 dark:border-rose-900/40 bg-rose-50/60 dark:bg-rose-500/5 p-4"
            >
              <div className="flex items-center justify-between gap-3 mb-2">
                <span className="text-xs font-semibold text-rose-700 dark:text-rose-400">
                  {dateStr} · {timeStr}
                </span>
                <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 shrink-0">
                  <Clock className="w-3 h-3" />
                  {duration}
                </span>
              </div>
              {f.errorMessage ? (
                <p className="font-mono text-xs text-rose-600 dark:text-rose-400 leading-relaxed break-words">
                  {f.errorMessage}
                </p>
              ) : (
                <p className="font-mono text-xs text-gray-400 dark:text-gray-500 italic">
                  No error message captured.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function PanelSkeleton() {
  return (
    <div className="space-y-7">
      {/* Activity grid skeleton */}
      <div>
        <div className="shimmer rounded h-3 w-24 mb-3" />
        <div className="space-y-1">
          {Array.from({ length: 5 }).map((_, ri) => (
            <div key={ri} className="flex gap-1">
              {Array.from({ length: 7 }).map((__, ci) => (
                <div key={ci} className="shimmer w-5 h-5 rounded-[3px]" />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Failures skeleton */}
      <div>
        <div className="shimmer rounded h-3 w-32 mb-3" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-2">
              <div className="flex justify-between">
                <div className="shimmer rounded h-3 w-36" />
                <div className="shimmer rounded h-3 w-14" />
              </div>
              <div className="shimmer rounded h-3 w-full" />
              <div className="shimmer rounded h-3 w-3/4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
