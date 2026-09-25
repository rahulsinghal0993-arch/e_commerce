'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext.js';

export function HeaderAuthLinks() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  if (loading) {
    return <span className="navlink text-bg/70">···</span>;
  }

  if (!user) {
    return (
      <Link href="/sign-in" className="navlink">
        Sign in
      </Link>
    );
  }

  const handleLogout = async () => {
    await logout();
    router.push('/');
    router.refresh();
  };

  return (
    <div className="flex items-center gap-4">
      <Link href="/orders" className="navlink">
        Orders
      </Link>
      <Link href="/account" className="navlink">
        {user.fullName?.split(' ')[0] || 'Account'}
      </Link>
      <button type="button" onClick={handleLogout} className="navlink cursor-pointer bg-transparent border-0 p-0">
        Sign out
      </button>
    </div>
  );
}
