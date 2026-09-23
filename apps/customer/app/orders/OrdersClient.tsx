'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ApiError } from '@arghya/api-client';
import { Button, EmptyState, Tag } from '@arghya/ui';
import { inr, orderStatusMeta } from '@arghya/utils';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../lib/api.js';
import type { CustomerOrder } from '../../lib/serverTypes.js';

function shortId(id: string): string {
  return id ? String(id).slice(0, 8).toUpperCase() : '';
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function OrdersClient() {
  const { userRole, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && userRole !== 'customer') {
      router.replace('/sign-in?next=/orders');
    }
  }, [authLoading, userRole, router]);

  useEffect(() => {
    if (authLoading || userRole !== 'customer') return;
    let active = true;
    (async () => {
      try {
        const res = (await api.myOrders()) as unknown as { items: CustomerOrder[] };
        if (active) setOrders(res.items ?? []);
      } catch (err) {
        if (active) setError(err instanceof ApiError ? err.message : 'Failed to load orders.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [authLoading, userRole]);

  if (authLoading || userRole !== 'customer') {
    return <div className="px-4 md:px-11 py-6 max-w-[900px] mx-auto w-full text-sm text-neutral-700">Checking your session…</div>;
  }

  return (
    <div className="px-4 md:px-11 py-6 max-w-[900px] mx-auto w-full">
      <h1 className="text-2xl mb-1">Your orders</h1>

      {loading && <p className="text-sm text-neutral-700 mt-6">Loading orders…</p>}

      {!loading && error && (
        <div className="mt-6">
          <EmptyState title="Could not load your orders" description={error} />
        </div>
      )}

      {!loading && !error && orders.length === 0 && (
        <div className="mt-6">
          <EmptyState
            title="No orders yet"
            description="Once you place an order, it will show up here."
            action={
              <Button as={Link} href="/category/all" variant="ghost">
                Browse all samagri
              </Button>
            }
          />
        </div>
      )}

      {!loading && !error && orders.length > 0 && (
        <div className="flex flex-col gap-3 mt-5">
          {orders.map((order) => {
            const tag = orderStatusMeta(order.status);
            return (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="block no-underline text-inherit p-4 rounded-3xl bg-surface hover:bg-accent-100/40 transition-colors"
              >
                <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
                  <span className="text-xs font-bold uppercase tracking-wide text-neutral-700">
                    Order #{shortId(order.id)}
                  </span>
                  <Tag variant={tag.variant}>{tag.label}</Tag>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate m-0">
                      {order.items?.map((i) => i.productName).join(', ') || 'Order items'}
                    </p>
                    <p className="text-xs text-neutral-700 m-0 mt-0.5">{formatDate(order.created_at)}</p>
                  </div>
                  <span className="font-heading text-[16px] shrink-0">{inr(order.total)}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
