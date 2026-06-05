import { prisma } from './prisma';
import type { AutomationJob, JobExecution } from '@prisma/client';
import type {
  TimePeriod,
  KpiMetrics,
  RoiBucket,
  SuccessRatioData,
  TopPerformer,
  JobTableRow,
  DashboardData,
} from './types';
import { isMonthPeriod, periodToLabel } from './types';

// ─── Period helpers ────────────────────────────────────────────────────────────

interface PeriodWindow {
  start: Date;
  end: Date;
  compStart: Date;
  compEnd: Date;
  label: string;
}

function getPeriodWindow(period: TimePeriod, now: Date): PeriodWindow {
  const day = 24 * 60 * 60 * 1000;

  if (isMonthPeriod(period)) {
    const [year, month] = period.split('-').map(Number);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);
    const compStart = new Date(year - 1, month - 1, 1);
    const compEnd = new Date(year - 1, month, 1);
    return { start, end, compStart, compEnd, label: periodToLabel(period) };
  }

  switch (period) {
    case '7d': {
      const start = new Date(now.getTime() - 7 * day);
      return { start, end: now, compStart: new Date(start.getTime() - 7 * day), compEnd: start, label: 'Last 7 Days' };
    }
    case '30d': {
      const start = new Date(now.getTime() - 30 * day);
      return { start, end: now, compStart: new Date(start.getTime() - 30 * day), compEnd: start, label: 'Last 30 Days' };
    }
    case '90d': {
      const start = new Date(now.getTime() - 90 * day);
      return { start, end: now, compStart: new Date(start.getTime() - 90 * day), compEnd: start, label: 'Last 90 Days' };
    }
    default: {
      const start = new Date(now.getFullYear(), 0, 1);
      const elapsed = now.getTime() - start.getTime();
      const prevYearStart = new Date(now.getFullYear() - 1, 0, 1);
      return {
        start,
        end: now,
        compStart: prevYearStart,
        compEnd: new Date(prevYearStart.getTime() + elapsed),
        label: 'Year to Date',
      };
    }
  }
}

// ─── Bucket builders ───────────────────────────────────────────────────────────

interface Bucket {
  label: string;
  start: Date;
  end: Date;
}

function buildBuckets(period: TimePeriod, now: Date): { buckets: Bucket[]; groupLabel: string } {
  const day = 24 * 60 * 60 * 1000;
  const MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  if (isMonthPeriod(period)) {
    const [year, month] = period.split('-').map(Number);
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 1);
    const buckets: Bucket[] = [];
    let cursor = monthStart;
    let weekNum = 1;
    while (cursor < monthEnd) {
      const end = new Date(Math.min(cursor.getTime() + 7 * day, monthEnd.getTime()));
      buckets.push({ label: `Wk ${weekNum} (${cursor.getMonth() + 1}/${cursor.getDate()})`, start: cursor, end });
      cursor = end;
      weekNum++;
    }
    return { buckets, groupLabel: 'Weekly' };
  }

  if (period === '7d') {
    const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const buckets: Bucket[] = [];
    for (let i = 6; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const end = new Date(start.getTime() + day);
      buckets.push({ label: `${DAY_NAMES[start.getDay()]} ${start.getMonth() + 1}/${start.getDate()}`, start, end });
    }
    return { buckets, groupLabel: 'Daily' };
  }

  if (period === '30d') {
    const buckets: Bucket[] = [];
    for (let i = 4; i >= 0; i--) {
      const end = new Date(now.getTime() - i * 7 * day);
      const start = new Date(end.getTime() - 7 * day);
      const fmtDate = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;
      buckets.push({ label: `${fmtDate(start)}–${fmtDate(end)}`, start, end });
    }
    return { buckets, groupLabel: 'Weekly' };
  }

  if (period === '90d') {
    const buckets: Bucket[] = [];
    for (let i = 2; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      buckets.push({ label: MONTH_ABBR[d.getMonth()], start, end });
    }
    return { buckets, groupLabel: 'Monthly' };
  }

  const buckets: Bucket[] = [];
  for (let m = 0; m <= now.getMonth(); m++) {
    const start = new Date(now.getFullYear(), m, 1);
    const end = new Date(now.getFullYear(), m + 1, 1);
    buckets.push({ label: MONTH_ABBR[m], start, end });
  }
  return { buckets, groupLabel: 'Monthly' };
}

// ─── Main ──────────────────────────────────────────────────────────────────────

export async function fetchDashboardData(
  annualFteCost: number = 120_000,
  period: TimePeriod = '30d'
): Promise<DashboardData> {
  const FTE_HOURS_PER_YEAR = 2080;
  const hourlyRate = annualFteCost / FTE_HOURS_PER_YEAR;

  const [jobs, executions] = await Promise.all([
    prisma.automationJob.findMany(),
    prisma.jobExecution.findMany({ orderBy: { executedAt: 'desc' } }),
  ]);

  const now = new Date();
  const jobMap = new Map(jobs.map((j) => [j.id, j]));
  const { start: periodStart, end: periodEnd, compStart, compEnd, label: periodLabel } = getPeriodWindow(period, now);

  // ─── Core helpers ──────────────────────────────────────────────────────────

  function calcMinutes(execs: JobExecution[]): number {
    return execs
      .filter((e) => e.status === 'Success')
      .reduce((sum, e) => {
        const job = jobMap.get(e.jobId);
        return sum + (job ? e.itemsProcessedCount * job.manualTimeSavedPerItemMinutes : 0);
      }, 0);
  }

  function calcSuccessRate(execs: JobExecution[]): number {
    if (execs.length === 0) return 0;
    return (execs.filter((e) => e.status === 'Success').length / execs.length) * 100;
  }

  function momChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  function inWindow(exec: JobExecution, start: Date, end: Date): boolean {
    return exec.executedAt >= start && exec.executedAt < end;
  }

  // ─── KPI windows ───────────────────────────────────────────────────────────

  const currentExecs = executions.filter((e) => inWindow(e, periodStart, periodEnd));
  const prevExecs = executions.filter((e) => inWindow(e, compStart, compEnd));

  const currentMinutes = calcMinutes(currentExecs);
  const prevMinutes = calcMinutes(prevExecs);
  const currentRate = calcSuccessRate(currentExecs);
  const prevRate = calcSuccessRate(prevExecs);

  const totalHoursSaved = currentMinutes / 60;

  // ─── EOY Projection (always based on rolling 30d window) ──────────────────
  const DAY_MS = 24 * 60 * 60 * 1000;
  const thirtyDayStart = new Date(now.getTime() - 30 * DAY_MS);
  const last30dExecs = executions.filter((e) => inWindow(e, thirtyDayStart, now));
  const last30dSavings = (calcMinutes(last30dExecs) / 60) * hourlyRate;
  const distinctActiveDays = new Set(last30dExecs.map((e) => e.executedAt.toISOString().slice(0, 10))).size;
  const eoyProjectedSavings = distinctActiveDays >= 7 ? (last30dSavings / 30) * 365 : null;

  const kpi: KpiMetrics = {
    totalJobs: jobs.length,
    totalJobsMoM: 0,
    avgSuccessRate: currentRate,
    avgSuccessRateMoM: momChange(currentRate, prevRate),
    totalHoursSaved,
    totalHoursSavedMoM: momChange(currentMinutes, prevMinutes),
    ftesReclaimed: totalHoursSaved / FTE_HOURS_PER_YEAR,
    totalFinancialSavings: totalHoursSaved * hourlyRate,
    totalFinancialSavingsMoM: momChange(currentMinutes, prevMinutes),
    eoyProjectedSavings,
    periodLabel,
  };

  // ─── ROI buckets ───────────────────────────────────────────────────────────

  const { buckets, groupLabel } = buildBuckets(period, now);
  const roiBuckets: RoiBucket[] = buckets.map(({ label, start, end }) => {
    const bucketExecs = executions.filter((e) => inWindow(e, start, end) && e.status === 'Success');
    const minutes = bucketExecs.reduce((s, e) => {
      const job = jobMap.get(e.jobId);
      return s + (job ? e.itemsProcessedCount * job.manualTimeSavedPerItemMinutes : 0);
    }, 0);
    return {
      label,
      hoursSaved: Math.round((minutes / 60) * 10) / 10,
      financialSavings: Math.round((minutes / 60) * hourlyRate),
      executions: bucketExecs.length,
    };
  });

  // ─── Success ratio ─────────────────────────────────────────────────────────

  const totalSuccess = currentExecs.filter((e) => e.status === 'Success').length;
  const totalFailed = currentExecs.filter((e) => e.status === 'Failed').length;
  const successRatio: SuccessRatioData[] = [
    { name: 'Success', value: totalSuccess, fill: '#22d3ee' },
    { name: 'Failed', value: totalFailed, fill: '#f43f5e' },
  ];

  // ─── Per-job aggregates ────────────────────────────────────────────────────

  const perJobStats = jobs.map((job: AutomationJob) => {
    const jobExecs = currentExecs.filter((e) => e.jobId === job.id);
    const successExecs = jobExecs.filter((e) => e.status === 'Success');
    const minutesSaved = successExecs.reduce(
      (s, e) => s + e.itemsProcessedCount * job.manualTimeSavedPerItemMinutes,
      0
    );
    const totalItems = successExecs.reduce((s, e) => s + e.itemsProcessedCount, 0);
    return {
      id: job.id,
      name: job.name,
      description: job.description,
      sourceSystem: job.sourceSystem,
      department: job.department,
      activeStatus: job.activeStatus,
      totalRuns: jobExecs.length,
      successRate: jobExecs.length > 0 ? (successExecs.length / jobExecs.length) * 100 : 0,
      totalItemsProcessed: totalItems,
      hoursSaved: minutesSaved / 60,
      financialSavings: (minutesSaved / 60) * hourlyRate,
    };
  });

  const topPerformers: TopPerformer[] = [...perJobStats]
    .sort((a, b) => b.financialSavings - a.financialSavings)
    .slice(0, 5)
    .map((j) => ({
      id: j.id,
      name: j.name,
      description: j.description,
      sourceSystem: j.sourceSystem,
      department: j.department,
      totalRuns: j.totalRuns,
      successRate: j.successRate,
      hoursSaved: j.hoursSaved,
      financialSavings: j.financialSavings,
    }));

  const jobTable: JobTableRow[] = perJobStats.map((j) => ({
    id: j.id,
    name: j.name,
    description: j.description,
    sourceSystem: j.sourceSystem,
    department: j.department,
    activeStatus: j.activeStatus,
    totalRuns: j.totalRuns,
    successRate: j.successRate,
    totalItemsProcessed: j.totalItemsProcessed,
    hoursSaved: j.hoursSaved,
    financialSavings: j.financialSavings,
  }));

  return { kpi, roiBuckets, monthlyRoi: roiBuckets, successRatio, topPerformers, jobTable, chartGroupLabel: groupLabel };
}
