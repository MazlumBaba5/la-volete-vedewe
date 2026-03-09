import { type ReactNode } from 'react';
import { type SubscriptionLevel } from '@/types';

interface BadgeProps {
  level: SubscriptionLevel;
}

export function TierBadge({ level }: BadgeProps) {
  if (level === 'diamond') return <span className="badge-diamond">💎 Diamond</span>;
  if (level === 'premium') return <span className="badge-premium">⭐ Premium</span>;
  return null;
}

interface TagProps {
  children: ReactNode;
  variant?: 'default' | 'accent';
}

export function Tag({ children, variant = 'default' }: TagProps) {
  const base =
    'inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap';
  const variants = {
    default: 'bg-[var(--bg-elevated)] text-gray-300 border border-[var(--border)]',
    accent: 'bg-[rgba(233,30,140,0.15)] text-[var(--accent)] border border-[rgba(233,30,140,0.3)]',
  };
  return <span className={`${base} ${variants[variant]}`}>{children}</span>;
}

export function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium">
      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
      Verificata
    </span>
  );
}
