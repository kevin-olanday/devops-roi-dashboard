'use client';

import { useEffect, useRef, useState } from 'react';

export function TopProgressBar({ active }: { active: boolean }) {
  const [mounted, setMounted] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const t1Ref = useRef<ReturnType<typeof setTimeout> | null>(null);
  const t2Ref = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const bar = barRef.current;
    const clear = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (t1Ref.current) clearTimeout(t1Ref.current);
      if (t2Ref.current) clearTimeout(t2Ref.current);
    };

    if (active) {
      clear();
      setMounted(true);
      // Need two rAF ticks so the browser registers the initial width=0 before transitioning
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = requestAnimationFrame(() => {
          if (!bar) return;
          bar.style.transition = 'width 8s cubic-bezier(0.04, 0.7, 0.1, 1), opacity 0ms';
          bar.style.width = '85%';
          bar.style.opacity = '1';
        });
      });
    } else {
      clear();
      if (!bar || !mounted) return;
      // Snap to 100%
      bar.style.transition = 'width 220ms ease-out, opacity 0ms';
      bar.style.width = '100%';
      // Then fade out
      t1Ref.current = setTimeout(() => {
        if (!bar) return;
        bar.style.transition = 'opacity 350ms ease';
        bar.style.opacity = '0';
        t2Ref.current = setTimeout(() => setMounted(false), 360);
      }, 220);
    }

    return clear;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // Reset bar position when unmounted so next mount starts from 0
  useEffect(() => {
    if (!mounted && barRef.current) {
      barRef.current.style.transition = 'none';
      barRef.current.style.width = '0%';
      barRef.current.style.opacity = '1';
    }
  }, [mounted]);

  if (!mounted) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[200] h-[2px] pointer-events-none">
      <div
        ref={barRef}
        className="h-full bg-cyan-500"
        style={{ width: '0%', opacity: 1, willChange: 'width, opacity' }}
      />
    </div>
  );
}
