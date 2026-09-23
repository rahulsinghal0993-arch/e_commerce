import type { ComponentPropsWithoutRef } from 'react';

export interface TextFieldProps extends Omit<ComponentPropsWithoutRef<'input'>, 'className'> {
  label?: string;
  className?: string;
  inputClassName?: string;
}

// Matches the artboards' .fld pill input + .lbl label pattern.
export function TextField({ label, id, className = '', inputClassName = '', ...props }: TextFieldProps) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="lbl mb-1.5 block text-xs text-neutral-700">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`min-h-[44px] w-full rounded-full border border-divider bg-surface px-4 text-sm text-text outline-none focus:border-accent ${inputClassName}`}
        {...props}
      />
    </div>
  );
}
