import { useEffect, useState, type ReactNode } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Boxes,
  Wallet,
  Store as StoreIcon,
  LogOut,
  Menu,
  X,
  Truck,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { StoreProvider, useStore } from '../context/StoreContext.js';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/orders', label: 'Orders', icon: Package },
  { to: '/listings', label: 'Listings', icon: Boxes },
  { to: '/inventory', label: 'Inventory', icon: Truck },
  { to: '/payouts', label: 'Payouts', icon: Wallet },
  { to: '/profile', label: 'Store profile', icon: StoreIcon },
];

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1 text-sm">
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={onNavigate}
          className={({ isActive }) =>
            'flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5 no-underline transition-colors ' +
            (isActive
              ? 'bg-accent font-bold text-bg'
              : 'text-text hover:bg-neutral-200')
          }
        >
          <Icon size={16} />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

function StoreCard() {
  const { store, loading } = useStore();

  if (loading) {
    return (
      <div className="animate-pulse rounded-2xl border border-divider bg-bg px-3.5 py-3">
        <div className="h-2 w-16 rounded-full bg-neutral-300" />
        <div className="mt-2 h-3 w-28 rounded-full bg-neutral-300" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-divider bg-bg px-3.5 py-3">
      <div className="text-[10px] uppercase tracking-wider text-neutral-700">Selling as</div>
      <div className="mt-0.5 truncate text-sm font-bold">{store?.name || 'Your store'}</div>
      {store?.description && (
        <div className="mt-0.5 truncate text-[11px] text-neutral-700">{store.description}</div>
      )}
    </div>
  );
}

function BrandMark({ size = 30 }: { size?: number }) {
  return (
    <span
      className="dev grid place-items-center rounded-full bg-accent pb-0.5 text-accent-2-300"
      style={{ width: size, height: size, fontSize: size * 0.57 }}
    >
      ॐ
    </span>
  );
}

export default function SellerShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate('/sign-in', { replace: true });
    }
  };

  return (
    <StoreProvider>
      <div className="min-h-screen bg-neutral-200 md:flex">
        {/* Desktop sidebar */}
        <aside className="hidden w-[230px] shrink-0 flex-col gap-4 border-r border-divider bg-surface p-4 md:flex">
          <NavLink to="/dashboard" className="flex items-center gap-2.5 no-underline text-text">
            <BrandMark />
            <div>
              <div className="font-heading text-base leading-tight">Arghya</div>
              <div className="text-[10px] text-neutral-700">Seller console</div>
            </div>
          </NavLink>
          <StoreCard />
          <NavList />
          <div className="mt-auto flex items-center gap-2.5 border-t border-divider pt-3 text-xs">
            <span className="ph grid h-8 w-8 place-items-center rounded-full text-[10px]">
              {(user?.fullName || user?.email || '?').slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate font-bold">{user?.fullName || 'Seller'}</div>
              <div className="truncate text-neutral-700">{user?.email}</div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              title="Sign out"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-neutral-700 hover:bg-neutral-200 hover:text-text"
            >
              <LogOut size={15} />
            </button>
          </div>
        </aside>

        {/* Mobile top bar */}
        <header className="sticky top-0 z-40 flex items-center gap-2.5 border-b border-divider bg-surface px-4 py-3 md:hidden">
          <BrandMark size={28} />
          <div className="font-heading text-base">Arghya Seller</div>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="ml-auto grid h-9 w-9 place-items-center rounded-full border border-divider"
            aria-label="Open menu"
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </header>

        {menuOpen && (
          <div className="border-b border-divider bg-surface px-4 pb-4 md:hidden">
            <div className="mb-3">
              <StoreCard />
            </div>
            <NavList onNavigate={() => setMenuOpen(false)} />
            <button
              type="button"
              onClick={handleLogout}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-divider py-2.5 text-sm font-bold"
            >
              <LogOut size={15} /> Sign out
            </button>
          </div>
        )}

        <main className="min-h-screen flex-1 bg-bg p-4 md:p-8">{children}</main>
      </div>
    </StoreProvider>
  );
}
