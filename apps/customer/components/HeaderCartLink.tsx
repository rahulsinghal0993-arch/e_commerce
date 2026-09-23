'use client';

import Link from 'next/link';
import { useCartStore } from '../store/cartStore.js';

export function HeaderCartLink({ light = true }: { light?: boolean }) {
  const totalItems = useCartStore((s) => s.getTotalItems());

  return (
    <Link href="/cart" className={`navlink inline-flex items-center gap-2 ${light ? 'text-bg' : 'text-text'}`}>
      Cart
      <span
        className={`inline-flex min-w-[20px] h-5 items-center justify-center rounded-full px-1 text-[11px] font-bold ${
          light ? 'bg-accent-2-500 text-accent-900' : 'bg-accent text-bg'
        }`}
      >
        {totalItems}
      </span>
    </Link>
  );
}
