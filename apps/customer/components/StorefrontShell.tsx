import type { ReactNode } from 'react';
import { SiteHeader } from './SiteHeader.js';
import { SiteFooter } from './SiteFooter.js';
import { MobileTabBar } from './MobileTabBar.js';

export function StorefrontShell({ children, showFooter = true }: { children: ReactNode; showFooter?: boolean }) {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 flex flex-col">{children}</main>
      {showFooter && <SiteFooter />}
      <MobileTabBar />
    </div>
  );
}
