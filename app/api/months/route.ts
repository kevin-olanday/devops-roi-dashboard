import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buildMonthOptions } from '@/lib/types';

export async function GET() {
  const executions = await prisma.jobExecution.findMany({
    select: { executedAt: true },
  });

  const monthSet = new Set<string>();
  for (const row of executions) {
    const d = row.executedAt;
    const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthSet.add(m);
  }

  const available = buildMonthOptions(12).filter((opt) => monthSet.has(opt.value));

  return NextResponse.json({ months: available });
}
