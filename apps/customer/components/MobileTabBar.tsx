'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCartStore } from '../store/cartStore.js';

const TABS = [
  { href: '/', label: 'Home', icon: '⌂' },
  { href: '/category/all', label: 'Shop', icon: '⌕' },
  { href: '/cart', label: 'Cart', icon: '▤' },
  { href: '/orders', label: 'Orders', icon: '▦' },
  { href: '/account', label: 'Profile', icon: '◕' },
] as const;

export function MobileTabBar() {
  const pathname = usePathname();
  const totalItems = useCartStore((s) => s.getTotalItems());

  return (
    <nav className="lg:hidden flex sticky bottom-0 border-t border-divider bg-bg px-2 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
      {TABS.map((tab) => {
        const active = tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`relative flex-1 text-center no-underline text-[10px] min-h-11 py-1 ${
              active ? 'text-accent' : 'text-neutral-700'
            }`}
          >
            <div className="text-[17px] leading-tight">{tab.icon}</div>
            {tab.label}
            {tab.href === '/cart' && totalItems > 0 && (
              <span className="absolute top-0 right-[22%] min-w-[16px] h-4 rounded-full bg-accent text-bg text-[9px] font-bold grid place-items-center px-0.5">
                {totalItems}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
