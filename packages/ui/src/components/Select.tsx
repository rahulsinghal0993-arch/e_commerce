import type { ComponentPropsWithoutRef, ReactNode } from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<ComponentPropsWithoutRef<'select'>, 'className'> {
  label?: string;
  className?: string;
  selectClassName?: string;
  options?: SelectOption[];
  children?: ReactNode;
}

// Matches TextField's label/pill-field convention.
export function Select({ label, id, className = '', selectClassName = '', options, children, ...props }: SelectProps) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="lbl mb-1.5 block text-xs text-neutral-700">
          {label}
        </label>
      )}
      <select
        id={id}
        className={`min-h-[44px] w-full rounded-full border border-divider bg-surface px-4 text-sm text-text outline-none focus:border-accent ${selectClassName}`}
        {...props}
      >
        {options
          ? options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))
          : children}
      </select>
    </div>
  );
}
