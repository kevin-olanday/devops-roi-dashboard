export type RollingPeriod = '7d' | '30d' | '90d' | 'ytd';
/** Rolling slug (e.g. "30d") or ISO month string (e.g. "2026-05") */
export type TimePeriod = RollingPeriod | string;

export const ROLLING_PERIOD_OPTIONS: { value: RollingPeriod; label: string }[] = [
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
  { value: 'ytd', label: 'Year to Date' },
];

/** @deprecated use ROLLING_PERIOD_OPTIONS */
export const PERIOD_OPTIONS = ROLLING_PERIOD_OPTIONS;

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Returns the last N calendar months as selectable options, newest first. */
export function buildMonthOptions(count = 6): { value: string; label: string }[] {
  const now = new Date();
  const opts: { value: string; label: string }[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
    opts.push({ value, label });
  }
  return opts;
}

/** True if the period string represents a specific calendar month (YYYY-MM). */
export function isMonthPeriod(period: string): boolean {
  return /^\d{4}-\d{2}$/.test(period);
}

/** Returns the human-readable label for any period value. */
export function periodToLabel(period: string): string {
  const rolling = ROLLING_PERIOD_OPTIONS.find((o) => o.value === period);
  if (rolling) return rolling.label;
  if (isMonthPeriod(period)) {
    const [year, month] = period.split('-').map(Number);
    return `${MONTH_NAMES[month - 1]} ${year}`;
  }
  return 'Last 30 Days';
}

export interface KpiMetrics {
  totalJobs: number;
  totalJobsMoM: number;
  avgSuccessRate: number;
  avgSuccessRateMoM: number;
  totalHoursSaved: number;
  totalHoursSavedMoM: number;
  ftesReclaimed: number;
  totalFinancialSavings: number;
  totalFinancialSavingsMoM: number;
  /** Annualised projection based on 30-day run rate. Null when < 7 days of data exist. */
  eoyProjectedSavings: number | null;
  /** Human-readable label for the selected period, e.g. "Last 30 Days" */
  periodLabel: string;
}

export interface RoiBucket {
  /** X-axis label: day name, week range, or month abbreviation */
  label: string;
  financialSavings: number;
  hoursSaved: number;
  executions: number;
}

/** @deprecated use RoiBucket */
export type MonthlyRoi = RoiBucket;

export interface SuccessRatioData {
  name: string;
  value: number;
  fill: string;
}

export interface TopPerformer {
  id: string;
  name: string;
  description: string;
  sourceSystem: string;
  department: string;
  totalRuns: number;
  successRate: number;
  hoursSaved: number;
  financialSavings: number;
}

export interface JobTableRow {
  id: string;
  name: string;
  description: string;
  sourceSystem: string;
  department: string;
  activeStatus: boolean;
  totalRuns: number;
  successRate: number;
  totalItemsProcessed: number;
  hoursSaved: number;
  financialSavings: number;
}

// ─── Execution Health Modal ───────────────────────────────────────────────────

export interface DaySummary {
  /** ISO date string: YYYY-MM-DD */
  date: string;
  successes: number;
  failures: number;
}

export interface RecentFailure {
  id: string;
  executedAt: string;
  durationSeconds: number;
  errorMessage: string | null;
}

export interface JobHealthData {
  jobId: string;
  jobName: string;
  periodLabel: string;
  aggregateSuccessRate: number;
  totalRuns: number;
  days: DaySummary[];
  recentFailures: RecentFailure[];
}

export interface DashboardData {
  kpi: KpiMetrics;
  roiBuckets: RoiBucket[];
  /** @deprecated use roiBuckets */
  monthlyRoi: RoiBucket[];
  successRatio: SuccessRatioData[];
  topPerformers: TopPerformer[];
  jobTable: JobTableRow[];
  /** Chart x-axis context label */
  chartGroupLabel: string;
}
