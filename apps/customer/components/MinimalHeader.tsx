import Link from 'next/link';
import type { ReactNode } from 'react';

export function MinimalHeader({ title, step }: { title: ReactNode; step?: ReactNode }) {
  return (
    <header className="flex items-center gap-4 px-4 md:px-8 py-3.5 bg-accent text-bg">
      <Link href="/" className="dev w-7 h-7 rounded-full bg-accent-2-500 text-accent-900 grid place-items-center text-[16px] pb-0.5 no-underline">
        ॐ
      </Link>
      <span className="font-heading text-[17px]">{title}</span>
      {step && <span className="ml-auto text-[13px] opacity-90">{step}</span>}
    </header>
  );
}
