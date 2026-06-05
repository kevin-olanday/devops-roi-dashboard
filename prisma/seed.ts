import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─── Helper ──────────────────────────────────────────────────────────────────

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(randInt(0, 23), randInt(0, 59), randInt(0, 59), 0);
  return d;
}

function pickStatus(successRate: number): 'Success' | 'Failed' {
  return Math.random() < successRate ? 'Success' : 'Failed';
}

// Batch item count distribution: some runs have 0 items (empty queue), most have moderate counts
function batchItems(min: number, max: number): number {
  const r = Math.random();
  if (r < 0.08) return 0; // empty queue
  if (r < 0.35) return randInt(1, Math.floor(max * 0.2));
  if (r < 0.75) return randInt(Math.floor(max * 0.2), Math.floor(max * 0.6));
  return randInt(Math.floor(max * 0.6), max);
}

const ERROR_MESSAGES = [
  'Timeout: no response from ServiceNow API after 30s',
  'Authentication token expired — OIDC refresh failed',
  'Target DB locked: concurrent write detected on table job_queue',
  'Connection refused: host erp.internal:5432 unreachable',
  'Assertion failed: expected items > 0, got 0 (empty queue)',
  'SSL certificate verification failed for api.vendor.io',
  'Rate limit exceeded: 429 from downstream API, retries exhausted',
  'Unhandled exception in step "validate_payload": NullPointerException at line 142',
  'Upstream dependency unavailable: SAP RFC_PING returned RFCIO_ERROR_SYSFAIL',
  'Step "push_to_queue" failed: message broker rejected payload (size > 256KB)',
] as const;

function pickError(): string {
  return ERROR_MESSAGES[Math.floor(Math.random() * ERROR_MESSAGES.length)];
}


const JOB_DEFS = [
  {
    name: 'Bulk AD Deprovisioning',
    description: 'Automates the removal of Active Directory access and M365 license reclamation during employee offboarding.',
    sourceSystem: 'Control-M',
    department: 'IT Security',
    manualTimeSavedPerItemMinutes: 15,
    activeStatus: true,
    // Runs every 3 days — batch job, large variance
    runs: (daysBack: number) => {
      const days: number[] = [];
      for (let d = 0; d <= daysBack; d += 3) days.push(d);
      return days;
    },
    successRate: 0.95,
    batch: true,
    batchRange: [2, 45] as [number, number],
    durationRange: [180, 600] as [number, number],
  },
  {
    name: 'Jira Ticket Sync',
    description: 'Bidirectional synchronisation of Jira issue states and assignments with internal engineering sprint trackers.',
    sourceSystem: 'Power Automate',
    department: 'Engineering',
    manualTimeSavedPerItemMinutes: 5,
    activeStatus: true,
    // Runs daily — batch, moderate variance
    runs: (daysBack: number) => Array.from({ length: daysBack + 1 }, (_, i) => i),
    successRate: 0.97,
    batch: true,
    batchRange: [3, 30] as [number, number],
    durationRange: [120, 480] as [number, number],
  },
  {
    name: 'Employee Onboarding Workflow',
    description: 'Provisions accounts, assigns role-based access controls, and triggers IT hardware requests for new hires.',
    sourceSystem: 'Power Automate',
    department: 'HR',
    manualTimeSavedPerItemMinutes: 20,
    activeStatus: true,
    // Runs 2x/week — single item
    runs: (daysBack: number) => {
      const days: number[] = [];
      for (let d = 0; d <= daysBack; d += 4) days.push(d);
      return days;
    },
    successRate: 0.98,
    batch: false,
    batchRange: [1, 1] as [number, number],
    durationRange: [300, 900] as [number, number],
  },
  {
    name: 'Weekly Compliance Report',
    description: 'Aggregates access logs, policy exceptions, and control test results into a SOC 2-aligned executive summary.',
    sourceSystem: 'Control-M',
    department: 'Compliance',
    manualTimeSavedPerItemMinutes: 60,
    activeStatus: true,
    // Runs weekly — single item, high value
    runs: (daysBack: number) => {
      const days: number[] = [];
      for (let d = 0; d <= daysBack; d += 7) days.push(d);
      return days;
    },
    successRate: 0.99,
    batch: false,
    batchRange: [1, 1] as [number, number],
    durationRange: [1800, 3600] as [number, number],
  },
  {
    name: 'Invoice Auto-Processing',
    description: 'Extracts, validates, and routes vendor invoices from email into the ERP approval queue via OCR and business rules.',
    sourceSystem: 'Power Automate',
    department: 'Finance',
    manualTimeSavedPerItemMinutes: 8,
    activeStatus: true,
    // Runs on weekdays — batch, medium variance
    runs: (daysBack: number) => {
      const days: number[] = [];
      const now = new Date();
      for (let d = 0; d <= daysBack; d++) {
        const day = new Date(now);
        day.setDate(day.getDate() - d);
        if (day.getDay() !== 0 && day.getDay() !== 6) days.push(d);
      }
      return days;
    },
    successRate: 0.93,
    batch: true,
    batchRange: [1, 25] as [number, number],
    durationRange: [240, 720] as [number, number],
  },
  {
    name: 'EKS Node Health Check',
    description: 'Polls Kubernetes node metrics and triggers PagerDuty alerts when CPU, memory, or disk thresholds are breached.',
    sourceSystem: 'Jenkins',
    department: 'Platform Engineering',
    manualTimeSavedPerItemMinutes: 3,
    activeStatus: true,
    // Runs daily — single item, high frequency
    runs: (daysBack: number) => Array.from({ length: daysBack + 1 }, (_, i) => i),
    successRate: 0.88,
    batch: false,
    batchRange: [1, 1] as [number, number],
    durationRange: [30, 120] as [number, number],
  },
  {
    name: 'Security Vulnerability Scan',
    description: 'Executes CVE scans across containerised workloads and publishes findings to the security risk register.',
    sourceSystem: 'Jenkins',
    department: 'IT Security',
    manualTimeSavedPerItemMinutes: 10,
    activeStatus: true,
    // Runs bi-weekly
    runs: (daysBack: number) => {
      const days: number[] = [];
      for (let d = 0; d <= daysBack; d += 14) days.push(d);
      return days;
    },
    successRate: 0.9,
    batch: false,
    batchRange: [1, 1] as [number, number],
    durationRange: [600, 1800] as [number, number],
  },
  {
    name: 'Data Warehouse ETL Refresh',
    description: 'Nightly pipeline syncing financial transaction records from production databases to the analytics warehouse.',
    sourceSystem: 'Control-M',
    department: 'Data Engineering',
    manualTimeSavedPerItemMinutes: 30,
    activeStatus: true,
    // Runs daily — single item
    runs: (daysBack: number) => Array.from({ length: daysBack + 1 }, (_, i) => i),
    successRate: 0.91,
    batch: false,
    batchRange: [1, 1] as [number, number],
    durationRange: [900, 2400] as [number, number],
  },
  {
    name: 'ServiceNow Ticket Router',
    description: 'Classifies and routes incoming IT service requests to the appropriate resolver group using keyword-based triage rules.',
    sourceSystem: 'Power Automate',
    department: 'IT Operations',
    manualTimeSavedPerItemMinutes: 7,
    activeStatus: true,
    // Runs every 2 days — batch, high volume
    runs: (daysBack: number) => {
      const days: number[] = [];
      for (let d = 0; d <= daysBack; d += 2) days.push(d);
      return days;
    },
    successRate: 0.95,
    batch: true,
    batchRange: [5, 50] as [number, number],
    durationRange: [60, 360] as [number, number],
  },
  {
    name: 'Certificate Renewal Monitor',
    description: 'Audits TLS certificate expiry across all public and internal endpoints and raises renewal tickets 30 days in advance.',
    sourceSystem: 'Jenkins',
    department: 'IT Security',
    manualTimeSavedPerItemMinutes: 25,
    activeStatus: false,
    // Runs weekly — single item
    runs: (daysBack: number) => {
      const days: number[] = [];
      for (let d = 0; d <= daysBack; d += 7) days.push(d);
      return days;
    },
    successRate: 0.85,
    batch: false,
    batchRange: [1, 1] as [number, number],
    durationRange: [120, 360] as [number, number],
  },
] as const;

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Clearing existing data...');
  await prisma.jobExecution.deleteMany();
  await prisma.automationJob.deleteMany();

  console.log('Seeding automation jobs...');
  const DAYS_BACK = 60;

  for (const def of JOB_DEFS) {
    const job = await prisma.automationJob.create({
      data: {
        name: def.name,
        description: def.description,
        sourceSystem: def.sourceSystem,
        department: def.department,
        manualTimeSavedPerItemMinutes: def.manualTimeSavedPerItemMinutes,
        activeStatus: def.activeStatus,
      },
    });

    const runDays = def.runs(DAYS_BACK);
    const executions = runDays.map((d) => {
      const status = pickStatus(def.successRate);
      const rawItems = def.batch
        ? batchItems(def.batchRange[0], def.batchRange[1])
        : 1;
      // Failed runs process 0 items
      const itemsProcessedCount = status === 'Failed' ? 0 : rawItems;
      return {
        jobId: job.id,
        executedAt: daysAgo(d),
        status,
        itemsProcessedCount,
        executionDurationSeconds: randInt(
          def.durationRange[0],
          def.durationRange[1]
        ),
        errorMessage: status === 'Failed' ? pickError() : null,
      };
    });

    await prisma.jobExecution.createMany({ data: executions });
    console.log(`  ✓ ${def.name}: ${executions.length} executions`);
  }

  const total = await prisma.jobExecution.count();
  console.log(`\nSeeding complete. ${total} total execution records.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
