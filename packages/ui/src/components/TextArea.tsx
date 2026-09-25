import type { ComponentPropsWithoutRef } from 'react';

export interface TextAreaProps extends Omit<ComponentPropsWithoutRef<'textarea'>, 'className'> {
  label?: string;
  className?: string;
  textareaClassName?: string;
}

// Textarea counterpart of TextField, same label/pill-field convention (a
// rounded rectangle rather than a full pill, since a pill reads oddly at
// multi-line height).
export function TextArea({ label, id, className = '', textareaClassName = '', rows = 4, ...props }: TextAreaProps) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="lbl mb-1.5 block text-xs text-neutral-700">
          {label}
        </label>
      )}
      <textarea
        id={id}
        rows={rows}
        className={`w-full rounded-2xl border border-divider bg-surface px-4 py-3 text-sm leading-relaxed text-text outline-none focus:border-accent ${textareaClassName}`}
        {...props}
      />
    </div>
  );
}
