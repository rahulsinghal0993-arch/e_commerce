import type { ReactNode } from 'react';

export interface EmptyStateProps {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center gap-3 py-20 text-center ${className}`}>
      <h3 className="text-2xl">{title}</h3>
      {description && <p className="max-w-md text-sm text-neutral-700">{description}</p>}
      {action}
    </div>
  );
}
