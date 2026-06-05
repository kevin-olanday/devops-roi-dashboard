'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { ROLLING_PERIOD_OPTIONS, periodToLabel } from '@/lib/types';

interface MonthOption {
  value: string;
  label: string;
}

interface PeriodSelectorProps {
  value: string;
  onChange: (value: string) => void;
  monthOptions: MonthOption[];
}

export function PeriodSelector({ value, onChange, monthOptions }: PeriodSelectorProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [open]);

  function select(v: string) {
    onChange(v);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-2 pl-3 pr-2.5 py-2.5 text-sm font-medium rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-colors whitespace-nowrap"
      >
        {periodToLabel(value)}
        <ChevronDown
          className={`w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 top-full mt-1.5 w-44 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 py-1 overflow-hidden"
        >
          {ROLLING_PERIOD_OPTIONS.map((opt) => (
            <Item key={opt.value} label={opt.label} active={value === opt.value} onSelect={() => select(opt.value)} />
          ))}

          {monthOptions.length > 0 && (
            <>
              <hr className="my-1 border-gray-200 dark:border-gray-700" />
              {monthOptions.map((opt) => (
                <Item key={opt.value} label={opt.label} active={value === opt.value} onSelect={() => select(opt.value)} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Item({ label, active, onSelect }: { label: string; active: boolean; onSelect: () => void }) {
  return (
    <button
      role="option"
      aria-selected={active}
      onClick={onSelect}
      className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors ${
        active
          ? 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-500/10'
          : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
      }`}
    >
      {label}
      {active && <Check className="w-3.5 h-3.5 shrink-0" />}
    </button>
  );
}
