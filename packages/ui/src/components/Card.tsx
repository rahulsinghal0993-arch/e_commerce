import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';

interface CardOwnProps<C extends ElementType> {
  as?: C;
  className?: string;
  children?: ReactNode;
}

export type CardProps<C extends ElementType = 'div'> = CardOwnProps<C> &
  Omit<ComponentPropsWithoutRef<C>, keyof CardOwnProps<C>>;

export function Card<C extends ElementType = 'div'>({ as, className = '', children, ...props }: CardProps<C>) {
  const As = (as || 'div') as ElementType;
  return (
    <As className={`rounded-3xl bg-surface ${className}`} {...props}>
      {children}
    </As>
  );
}
