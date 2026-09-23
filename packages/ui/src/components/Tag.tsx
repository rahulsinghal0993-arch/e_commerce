import type { ReactNode } from 'react';

// Matches the artboards' .tag / .tag-live / .tag-warn / .tag-mute classes.
export type TagVariant = 'live' | 'warn' | 'mute';

const VARIANT_CLASS: Record<TagVariant, string> = {
  live: 'bg-accent-2-200 text-accent-2-900',
  warn: 'bg-accent-100 text-accent-800',
  mute: 'bg-neutral-200 text-neutral-800',
};

export interface TagProps {
  variant?: TagVariant;
  className?: string;
  children?: ReactNode;
}

export function Tag({ variant = 'mute', className = '', children }: TagProps) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] ${VARIANT_CLASS[variant]} ${className}`}>
      {children}
    </span>
  );
}
