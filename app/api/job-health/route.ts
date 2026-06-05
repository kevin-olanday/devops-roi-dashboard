import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isMonthPeriod, periodToLabel } from '@/lib/types';

export const dynamic = 'force-dynamic';
import type { DaySummary, RecentFailure, JobHealthData } from '@/lib/types';

function getPeriodBounds(period: string): { start: Date; end: Date } {
  const now = new Date();
  const day = 86_400_000;

  if (isMonthPeriod(period)) {
    const [year, month] = period.split('-').map(Number);
    return { start: new Date(year, month - 1, 1), end: new Date(year, month, 1) };
  }
  switch (period) {
    case '7d':  return { start: new Date(now.getTime() - 7 * day),  end: now };
    case '30d': return { start: new Date(now.getTime() - 30 * day), end: now };
    case '90d': return { start: new Date(now.getTime() - 90 * day), end: now };
    default:    return { start: new Date(now.getFullYear(), 0, 1),   end: now };
  }
}

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getDaysInRange(start: Date, end: Date): string[] {
  const days: string[] = [];
  const day = 86_400_000;
  const s = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const e = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  for (let d = new Date(s); d <= e; d = new Date(d.getTime() + day)) {
    days.push(isoDate(d));
  }
  return days;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('jobId');
  const period = searchParams.get('period') ?? '30d';

  if (!jobId) {
    return NextResponse.json({ error: 'jobId required' }, { status: 400 });
  }

  const { start, end } = getPeriodBounds(period);

  const [job, executions] = await Promise.all([
    prisma.automationJob.findUnique({
      where: { id: jobId },
      select: { id: true, name: true },
    }),
    prisma.jobExecution.findMany({
      where: {
        jobId,
        executedAt: { gte: start, lt: end },
      },
      orderBy: { executedAt: 'desc' },
      select: {
        id: true,
        executedAt: true,
        status: true,
        executionDurationSeconds: true,
        errorMessage: true,
      },
    }),
  ]);

  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  const dayMap = new Map<string, { successes: number; failures: number }>();
  for (const exec of executions) {
    const key = isoDate(exec.executedAt);
    const slot = dayMap.get(key) ?? { successes: 0, failures: 0 };
    if (exec.status === 'Success') slot.successes++;
    else slot.failures++;
    dayMap.set(key, slot);
  }

  const days: DaySummary[] = getDaysInRange(start, end).map((date) => {
    const slot = dayMap.get(date) ?? { successes: 0, failures: 0 };
    return { date, successes: slot.successes, failures: slot.failures };
  });

  const recentFailures: RecentFailure[] = executions
    .filter((e) => e.status === 'Failed')
    .slice(0, 5)
    .map((e) => ({
      id: e.id,
      executedAt: e.executedAt.toISOString(),
      durationSeconds: e.executionDurationSeconds,
      errorMessage: e.errorMessage ?? null,
    }));

  const totalRuns = executions.length;
  const successCount = executions.filter((e) => e.status === 'Success').length;

  const data: JobHealthData = {
    jobId,
    jobName: job.name,
    periodLabel: periodToLabel(period),
    aggregateSuccessRate: totalRuns > 0 ? (successCount / totalRuns) * 100 : 0,
    totalRuns,
    days,
    recentFailures,
  };

  return NextResponse.json(data);
}
