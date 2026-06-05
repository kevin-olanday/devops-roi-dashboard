'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Settings, DollarSign } from 'lucide-react';
import { useDashboard } from '@/lib/dashboard-context';

function formatFte(n: number): string {
  return n.toLocaleString('en-US');
}

function parseFte(s: string): number {
  return parseFloat(s.replace(/[,$]/g, ''));
}

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const { fteCost, setFteCost } = useDashboard();
  const [inputValue, setInputValue] = useState(formatFte(fteCost));
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync display value when fteCost changes externally
  useEffect(() => {
    setInputValue(formatFte(fteCost));
  }, [fteCost]);

  // Focus input when panel opens
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.select(), 120);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Dismiss on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  function commit() {
    const parsed = parseFte(inputValue);
    if (!isNaN(parsed) && parsed > 0) {
      setFteCost(parsed);
      setInputValue(formatFte(parsed));
    } else {
      setInputValue(formatFte(fteCost));
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      commit();
      inputRef.current?.blur();
    }
  }

  function handleFocus(e: React.FocusEvent<HTMLInputElement>) {
    setInputValue(String(fteCost));
    e.target.select();
  }

  const hourlyRate = fteCost / 2080;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Dashboard Settings"
        className={`fixed top-0 right-0 h-full z-50 w-full max-w-sm flex flex-col
          bg-white dark:bg-gray-900
          border-l border-gray-200 dark:border-gray-700/80
          shadow-2xl
          transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Panel header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 dark:border-gray-700/80">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20">
              <Settings className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            </div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Close settings"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Panel body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">

          {/* Financial Configuration section */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
              <span className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 px-1">
                Financial Configuration
              </span>
              <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
            </div>

            <div className="space-y-3">
              <label className="block">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">
                  Annual Blended FTE Cost
                </span>
                {/* Input row */}
                <div className="flex items-center gap-0 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 overflow-hidden focus-within:border-cyan-500 focus-within:ring-1 focus-within:ring-cyan-500/40 transition-all">
                  <div className="flex items-center gap-1.5 pl-4 pr-2 shrink-0">
                    <DollarSign className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                  </div>
                  <input
                    ref={inputRef}
                    type="text"
                    inputMode="numeric"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onBlur={commit}
                    onFocus={handleFocus}
                    onKeyDown={handleKeyDown}
                    className="flex-1 min-w-0 bg-transparent py-3 pr-2 text-sm font-semibold text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none tabular-nums"
                    placeholder="120,000"
                  />
                  <span className="pr-4 text-xs font-medium text-gray-400 dark:text-gray-500 shrink-0">
                    /yr
                  </span>
                </div>

                <p className="mt-2 text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
                  Used to calculate estimated financial ROI. Standard FTE = 2,080 hours/year.
                </p>
              </label>

              {/* Derived rate display */}
              <div className="rounded-xl bg-cyan-50 dark:bg-cyan-500/5 border border-cyan-100 dark:border-cyan-500/15 px-4 py-3 flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">Derived hourly rate</span>
                <span className="text-sm font-bold tabular-nums text-cyan-700 dark:text-cyan-400">
                  ${hourlyRate.toFixed(2)}<span className="text-xs font-normal ml-0.5">/hr</span>
                </span>
              </div>
            </div>
          </section>

          {/* Future sections placeholder */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
              <span className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 px-1">
                About
              </span>
              <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
              BizOps DevOps ROI Dashboard v1.0.
              Changes take effect immediately across all KPI cards, charts, and the job registry.
            </p>
          </section>
        </div>

        {/* Panel footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700/80">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </>
  );
}
