'use client';

import { useState, useMemo, useEffect } from 'react';
import { Search, ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { InfoTooltip } from './InfoTooltip';
import { ExecutionHealthModal } from './ExecutionHealthModal';
import type { JobTableRow } from '@/lib/types';

const PAGE_SIZE = 10;

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

type SortKey = keyof JobTableRow;
type SortDir = 'asc' | 'desc';

function fmtCurrency(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

interface JobDataGridProps {
  rows: JobTableRow[];
  period: string;
  periodLabel: string;
}

export function JobDataGrid({ rows, period, periodLabel }: JobDataGridProps) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('financialSavings');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  // Reset to page 1 whenever search term or source data changes
  useEffect(() => { setPage(1); }, [search, rows]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.sourceSystem.toLowerCase().includes(q) ||
        r.department.toLowerCase().includes(q)
    );
  }, [rows, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === 'string' && typeof bv === 'string')
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      if (typeof av === 'number' && typeof bv === 'number')
        return sortDir === 'asc' ? av - bv : bv - av;
      if (typeof av === 'boolean' && typeof bv === 'boolean')
        return sortDir === 'asc' ? Number(av) - Number(bv) : Number(bv) - Number(av);
      return 0;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const paginated = sorted.slice(pageStart, pageStart + PAGE_SIZE);

  function handleSort(key: SortKey) {
    if (key === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
    setPage(1);
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (col !== sortKey) return <ChevronsUpDown className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600" />;
    return sortDir === 'asc'
      ? <ChevronUp className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
      : <ChevronDown className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />;
  }

  // Build visible page numbers: always show first, last, current ±1, with ellipsis gaps
  const pageNumbers = useMemo(() => {
    const pages: (number | '…')[] = [];
    const add = new Set<number>();
    [1, totalPages, safePage - 1, safePage, safePage + 1].forEach((p) => {
      if (p >= 1 && p <= totalPages) add.add(p);
    });
    const sorted = Array.from(add).sort((a, b) => a - b);
    sorted.forEach((p, i) => {
      if (i > 0 && p - sorted[i - 1] > 1) pages.push('…');
      pages.push(p);
    });
    return pages;
  }, [safePage, totalPages]);

  const columns: { key: SortKey; label: string; align?: 'right' }[] = [
    { key: 'name', label: 'Job Name' },
    { key: 'sourceSystem', label: 'Source' },
    { key: 'activeStatus', label: 'Status' },
    { key: 'totalRuns', label: 'Runs', align: 'right' },
    { key: 'successRate', label: 'Success Rate', align: 'right' },
    { key: 'totalItemsProcessed', label: 'Items Processed', align: 'right' },
    { key: 'hoursSaved', label: 'Hrs Saved', align: 'right' },
    { key: 'financialSavings', label: 'Financial ROI', align: 'right' },
  ];

  const rangeStart = sorted.length === 0 ? 0 : pageStart + 1;
  const rangeEnd = Math.min(pageStart + PAGE_SIZE, sorted.length);

  return (
    <>
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm dark:shadow-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 pt-6 pb-5">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
            Automation Job Registry
          </h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{filtered.length} jobs · {periodLabel}</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search jobs, source, department..."
            className="pl-9 pr-4 py-2 w-full sm:w-72 text-sm rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-colors"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className={`pb-3 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-300 transition-colors whitespace-nowrap first:pl-6 last:pr-6 ${
                    col.align === 'right' ? 'text-right' : 'text-left'
                  }`}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.align === 'right' && <SortIcon col={col.key} />}
                    {col.label}
                    {col.align !== 'right' && <SortIcon col={col.key} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {paginated.map((row) => {
              const srcColor = SOURCE_COLORS[row.sourceSystem] ?? SOURCE_COLORS.default;
              return (
                <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors">
                  <td className="py-3 pl-6 pr-3">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="font-medium text-gray-900 dark:text-white leading-snug">{row.name}</span>
                      {row.description && <InfoTooltip text={row.description} />}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${srcColor}`}>
                      {row.sourceSystem}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                        row.activeStatus
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700/60'
                          : 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-700/40 dark:text-gray-300 dark:border-gray-600'
                      }`}
                    >
                      {row.activeStatus ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right text-gray-600 dark:text-gray-300 tabular-nums">
                    {row.totalRuns}
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums">
                    <button
                      onClick={() => setSelectedJobId(row.id)}
                      title="View execution health"
                      className={`tabular-nums border-b border-dashed pb-px cursor-pointer transition-colors focus:outline-none ${
                        row.successRate >= 95
                          ? 'text-emerald-600 dark:text-emerald-400 border-emerald-400/60 dark:border-emerald-600/60 hover:text-emerald-500 dark:hover:text-emerald-300'
                          : row.successRate >= 85
                          ? 'text-amber-600 dark:text-amber-400 border-amber-400/60 dark:border-amber-600/60 hover:text-amber-500 dark:hover:text-amber-300'
                          : 'text-rose-500 dark:text-rose-400 border-rose-400/60 dark:border-rose-600/60 hover:text-rose-400 dark:hover:text-rose-300'
                      }`}
                    >
                      {row.successRate.toFixed(1)}%
                    </button>
                  </td>
                  <td className="py-3 px-3 text-right text-gray-600 dark:text-gray-300 tabular-nums">
                    {row.totalItemsProcessed.toLocaleString('en-US')}
                  </td>
                  <td className="py-3 px-3 text-right text-gray-600 dark:text-gray-300 tabular-nums">
                    {row.hoursSaved.toFixed(1)}h
                  </td>
                  <td className="py-3 pl-3 pr-6 text-right font-semibold text-cyan-600 dark:text-cyan-400 tabular-nums">
                    {fmtCurrency(row.financialSavings)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {sorted.length === 0 && (
          <div className="py-12 text-center text-gray-400 text-sm">No jobs match your search.</div>
        )}
      </div>

      {/* Pagination footer */}
      {sorted.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700/60">
          {/* Range label */}
          <p className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
            Showing <span className="font-medium text-gray-600 dark:text-gray-300">{rangeStart}–{rangeEnd}</span> of{' '}
            <span className="font-medium text-gray-600 dark:text-gray-300">{sorted.length}</span> jobs
          </p>

          {/* Page controls */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <PageBtn
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                label="Previous"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Prev</span>
              </PageBtn>

              {pageNumbers.map((p, i) =>
                p === '…' ? (
                  <span key={`ellipsis-${i}`} className="px-1.5 text-xs text-gray-400 select-none">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`min-w-[2rem] h-8 px-2 rounded-lg text-xs font-medium transition-colors ${
                      p === safePage
                        ? 'bg-cyan-500 text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}

              <PageBtn
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                label="Next"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </PageBtn>
            </div>
          )}
        </div>
      )}
    </div>

    <ExecutionHealthModal
      jobId={selectedJobId}
      period={period}
      onClose={() => setSelectedJobId(null)}
    />
    </>
  );
}

function PageBtn({
  children,
  onClick,
  disabled,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled: boolean;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex items-center gap-1 h-8 px-2.5 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
    >
      {children}
    </button>
  );
}

