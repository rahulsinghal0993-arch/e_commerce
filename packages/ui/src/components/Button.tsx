import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';

// Matches the artboards' .btn / .btn-ghost / .btn-quiet classes.
export type ButtonVariant = 'solid' | 'ghost' | 'quiet';

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  solid: 'bg-accent text-bg hover:bg-accent-700 border-0',
  ghost: 'bg-transparent text-accent-700 border border-accent hover:bg-accent-100',
  quiet: 'bg-transparent text-text border border-divider font-bold hover:bg-neutral-100',
};

interface ButtonOwnProps<C extends ElementType> {
  as?: C;
  variant?: ButtonVariant;
  className?: string;
  children?: ReactNode;
}

export type ButtonProps<C extends ElementType = 'button'> = ButtonOwnProps<C> &
  Omit<ComponentPropsWithoutRef<C>, keyof ButtonOwnProps<C>>;

export function Button<C extends ElementType = 'button'>({
  as,
  variant = 'solid',
  className = '',
  children,
  ...props
}: ButtonProps<C>) {
  const As = (as || 'button') as ElementType;
  return (
    <As
      className={`inline-flex min-h-[46px] items-center justify-center gap-2 rounded-full px-6 font-heading text-[15px] no-underline transition-colors cursor-pointer ${VARIANT_CLASS[variant]} ${className}`}
      {...props}
    >
      {children}
    </As>
  );
}
