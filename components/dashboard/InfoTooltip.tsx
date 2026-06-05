'use client';

import { useState, useRef, useCallback } from 'react';
import { Info } from 'lucide-react';

interface TooltipPos {
  anchorTop: number;
  anchorLeft: number;
  anchorWidth: number;
}

interface InfoTooltipProps {
  text: string;
}

const MAX_WIDTH = 280;
const VIEWPORT_MARGIN = 8;

export function InfoTooltip({ text }: InfoTooltipProps) {
  const [pos, setPos] = useState<TooltipPos | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const iconRef = useRef<HTMLSpanElement>(null);

  const show = useCallback(() => {
    timerRef.current = setTimeout(() => {
      if (iconRef.current) {
        const r = iconRef.current.getBoundingClientRect();
        setPos({ anchorTop: r.top, anchorLeft: r.left, anchorWidth: r.width });
      }
    }, 200);
  }, []);

  const hide = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setPos(null);
  }, []);

  if (!text) return null;

  // Viewport-clamped left so tooltip never overflows edges
  const rawLeft = pos ? pos.anchorLeft + pos.anchorWidth / 2 - MAX_WIDTH / 2 : 0;
  const clampedLeft = pos
    ? Math.max(VIEWPORT_MARGIN, Math.min(rawLeft, window.innerWidth - MAX_WIDTH - VIEWPORT_MARGIN))
    : 0;

  return (
    <>
      <span
        ref={iconRef}
        className="inline-flex items-center"
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        <Info
          className="w-3.5 h-3.5 text-gray-400 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors cursor-default shrink-0"
          aria-label="More info"
        />
      </span>

      {pos && (
        <span
          role="tooltip"
          style={{
            position: 'fixed',
            top: pos.anchorTop - 8,
            left: clampedLeft,
            transform: 'translateY(-100%)',
            width: MAX_WIDTH,
            zIndex: 9999,
          }}
          className="pointer-events-none px-3 py-2 rounded-lg text-xs leading-relaxed shadow-lg whitespace-normal break-words bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
        >
          {text}
        </span>
      )}
    </>
  );
}
