import { Dashboard } from '@/components/dashboard/Dashboard';
import { DashboardProvider } from '@/lib/dashboard-context';

export default function Home() {
  return (
    <DashboardProvider>
      <Dashboard />
    </DashboardProvider>
  );
}
