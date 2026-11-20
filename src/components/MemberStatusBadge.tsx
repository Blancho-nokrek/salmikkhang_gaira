import React from 'react';
import { CheckCircle2, Clock, MinusCircle } from 'lucide-react';
import { MemberStatus } from '../types';
import { getMemberStatusMeta } from '../lib/memberStatus';

interface MemberStatusBadgeProps {
  status?: MemberStatus | string | null;
  t: (en: string, bn: string) => string;
  size?: 'sm' | 'md';
  variant?: 'surface' | 'onDark';
  className?: string;
}

export const MemberStatusBadge: React.FC<MemberStatusBadgeProps> = ({
  status,
  t,
  size = 'sm',
  variant = 'surface',
  className = '',
}) => {
  const meta = getMemberStatusMeta(status);
  const label = t(meta.labelEn, meta.labelBn);

  const Icon =
    meta.status === 'On-Leave'
      ? Clock
      : meta.status === 'Inactive'
      ? MinusCircle
      : CheckCircle2;

  const palette =
    variant === 'onDark'
      ? meta.tone === 'emerald'
        ? 'bg-emerald-400/15 border-emerald-300/40 text-emerald-100'
        : meta.tone === 'amber'
        ? 'bg-amber-400/20 border-amber-300/45 text-amber-100'
        : 'bg-white/10 border-white/25 text-slate-200'
      : meta.tone === 'emerald'
      ? 'bg-emerald-50/95 dark:bg-emerald-950/70 border-emerald-500/35 dark:border-emerald-500/40 text-emerald-900 dark:text-emerald-200'
      : meta.tone === 'amber'
      ? 'bg-amber-50/95 dark:bg-amber-950/70 border-amber-500/40 dark:border-amber-500/45 text-amber-950 dark:text-amber-200'
      : 'bg-slate-100/95 dark:bg-slate-800/85 border-slate-300/80 dark:border-slate-600/70 text-slate-700 dark:text-slate-300';

  const iconColor =
    variant === 'onDark'
      ? meta.tone === 'emerald'
        ? 'text-emerald-300'
        : meta.tone === 'amber'
        ? 'text-amber-300'
        : 'text-slate-300'
      : meta.tone === 'emerald'
      ? 'text-emerald-600 dark:text-emerald-400'
      : meta.tone === 'amber'
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-slate-500 dark:text-slate-400';

  const sizing =
    size === 'md'
      ? 'px-2.5 py-1 text-xs gap-1.5 rounded-lg'
      : 'px-2 py-0.5 text-[11px] gap-1 rounded-lg';

  const iconSizing = size === 'md' ? 'w-3.5 h-3.5' : 'w-3 h-3';

  return (
    <span
      data-testid="member-status-badge"
      data-member-status={meta.status}
      aria-label={`${t('Member status', 'সদস্যের অবস্থা')}: ${label}`}
      className={`inline-flex items-center font-bold border tracking-tight whitespace-nowrap shrink-0 leading-none ${sizing} ${palette} ${className}`}
    >
      <Icon className={`${iconSizing} ${iconColor} shrink-0`} aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
};
