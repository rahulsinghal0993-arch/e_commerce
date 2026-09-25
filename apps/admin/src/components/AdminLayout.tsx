import type { ReactNode } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import type { User } from '@arghya/api-client';
import { useAuth } from '../context/AuthContext.js';

interface NavItem {
  to: string;
  label: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

// Grouped the same way as the product artboards' sidebar, trimmed to the
// screens this app actually ships (no store queue / coupons / staff yet).
const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Operations',
    items: [
      { to: '/dashboard', label: 'Dashboard' },
      { to: '/orders', label: 'Orders' },
      { to: '/payments', label: 'Payments & refunds' },
    ],
  },
  {
    label: 'Marketplace',
    items: [
      { to: '/sellers', label: 'Sellers' },
      { to: '/moderation', label: 'Listing moderation' },
      { to: '/commissions', label: 'Commission & payouts' },
    ],
  },
  {
    label: 'Catalog & people',
    items: [
      { to: '/catalog', label: 'Catalog' },
      { to: '/inventory', label: 'Inventory by store' },
      { to: '/customers', label: 'Customers' },
    ],
  },
];

function initialsOf(user: User | null): string {
  const source = user?.fullName || user?.email || 'Admin';
  return source
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await logout();
    navigate('/sign-in', { replace: true });
  }

  return (
    <div className="flex min-h-screen bg-bg">
      <aside className="flex w-60 flex-none flex-col gap-5 bg-neutral-900 px-4 py-5 text-neutral-200">
        <Link to="/dashboard" className="flex items-center gap-2.5 text-inherit no-underline">
          <span className="font-devanagari grid h-8 w-8 flex-none place-items-center rounded-full bg-accent-2-500 pb-0.5 text-lg text-accent-900">
            ॐ
          </span>
          <div>
            <div className="font-heading text-base text-neutral-100">Arghya</div>
            <div className="text-[10px] opacity-70">Marketplace admin</div>
          </div>
        </Link>

        <nav className="flex flex-col gap-4 text-[12.5px]">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="flex flex-col gap-0.5">
              <div className="mb-1 px-3 text-[9px] uppercase tracking-[0.12em] opacity-55">
                {group.label}
              </div>
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `block rounded-2xl px-3 py-2 no-underline ${
                      isActive ? 'bg-accent font-bold text-bg' : 'text-inherit hover:bg-white/10'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="mt-auto flex items-center gap-2.5 text-xs">
          <span className="grid h-8 w-8 flex-none place-items-center rounded-full bg-neutral-700 text-[11px] font-bold text-neutral-100">
            {initialsOf(user)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate font-bold">{user?.fullName || user?.email || 'Admin'}</div>
            <div className="truncate opacity-80">Admin</div>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex-none cursor-pointer border-0 bg-transparent text-[11px] font-bold text-neutral-300 hover:text-neutral-100"
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-x-hidden px-8 py-7">{children}</main>
    </div>
  );
}
