import { NextRequest, NextResponse } from 'next/server';
import { fetchDashboardData } from '@/lib/data';
import { isMonthPeriod } from '@/lib/types';

const ROLLING_PERIODS = new Set(['7d', '30d', '90d', 'ytd']);

function isValidPeriod(p: string): boolean {
  return ROLLING_PERIODS.has(p) || isMonthPeriod(p);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const rawFte = parseFloat(searchParams.get('fte') ?? '120000');
  const annualFteCost = isNaN(rawFte) || rawFte <= 0 ? 120_000 : rawFte;

  const rawPeriod = searchParams.get('period') ?? '30d';
  const period = isValidPeriod(rawPeriod) ? rawPeriod : '30d';

  try {
    const data = await fetchDashboardData(annualFteCost, period);
    return NextResponse.json(data);
  } catch (err) {
    console.error('Dashboard data fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
