type DbStatus = 'loading' | 'ok' | 'error';

const STATUS_CONFIG: Record<DbStatus, { dot: string; ping: string; label: string; text: string }> = {
  loading: {
    dot: 'bg-amber-400',
    ping: 'bg-amber-400',
    label: 'text-amber-500 dark:text-amber-400',
    text: 'Connecting…',
  },
  ok: {
    dot: 'bg-emerald-500',
    ping: 'bg-emerald-400',
    label: 'text-emerald-600 dark:text-emerald-400',
    text: 'Connected',
  },
  error: {
    dot: 'bg-rose-500',
    ping: 'bg-rose-400',
    label: 'text-rose-500 dark:text-rose-400',
    text: 'Unreachable',
  },
};

interface FooterProps {
  status: DbStatus;
}

export function Footer({ status }: FooterProps) {
  const cfg = STATUS_CONFIG[status];

  const links = [
    { label: 'Documentation', href: '#' },
    { label: 'Support', href: '#' },
    { label: 'API Runbooks', href: '#' },
  ];

  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0">

        {/* Left: brand + version */}
        <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1.5 whitespace-nowrap">
          BizOps DevOps ROI Dashboard
          <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 font-mono text-gray-400 dark:text-gray-500 text-[10px] leading-none">
            v1.2.4-stable
          </span>
        </p>

        {/* Center: live db status */}
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            {status !== 'error' && (
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${cfg.ping} opacity-60`} />
            )}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${cfg.dot}`} />
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            Supabase:&nbsp;<span className={`font-medium ${cfg.label}`}>{cfg.text}</span>
          </span>
        </div>

        {/* Right: links */}
        <nav className="flex items-center gap-4">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

      </div>
    </footer>
  );
}
