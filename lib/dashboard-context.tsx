'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface DashboardContextValue {
  fteCost: number;
  setFteCost: (v: number) => void;
  period: string;
  setPeriod: (v: string) => void;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [fteCost, setFteCostRaw] = useState(120_000);
  const [period, setPeriod] = useState<string>('30d');

  const setFteCost = useCallback((v: number) => {
    if (v > 0) setFteCostRaw(v);
  }, []);

  return (
    <DashboardContext.Provider value={{ fteCost, setFteCost, period, setPeriod }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard(): DashboardContextValue {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error('useDashboard must be used inside DashboardProvider');
  return ctx;
}
