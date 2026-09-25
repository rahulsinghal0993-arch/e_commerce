import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, EmptyState } from '@arghya/ui';
import { inr } from '@arghya/utils';
import type { OrderStatus } from '@arghya/api-client';
import { api, type SellerOrder, type SellerProduct } from '../lib/api.js';

const DISPATCHABLE = new Set<OrderStatus>(['pending', 'paid']);
const SOLD_STATUSES = new Set<OrderStatus>(['paid', 'shipped', 'delivered']);

function isToday(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
  );
}

export default function SellerDashboard() {
  const [orders, setOrders] = useState<SellerOrder[] | null>(null);
  const [products, setProducts] = useState<SellerProduct[] | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [ordersRes, productsRes] = await Promise.all([api.sellerOrders(), api.sellerProducts()]);
        if (!active) return;
        setOrders(ordersRes.items ?? []);
        setProducts(productsRes.items ?? []);
      } catch (err) {
        if (active) setError(err);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    if (!orders) return null;
    const toDispatch = orders.filter((o) => DISPATCHABLE.has(o.status));
    const todaysSales = orders.filter((o) => SOLD_STATUSES.has(o.status) && isToday(o.createdAt));
    const salesToday = todaysSales.reduce((sum, o) => sum + o.total, 0);

    const tally = new Map<string, number>();
    for (const order of orders) {
      if (!SOLD_STATUSES.has(order.status)) continue;
      for (const item of order.items) {
        tally.set(item.productName, (tally.get(item.productName) ?? 0) + item.quantity);
      }
    }
    const bestSellers = [...tally.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);

    return { toDispatch, salesToday, bestSellers };
  }, [orders]);

  const lowStock = useMemo(
    () => (products ?? []).filter((p) => p.status !== 'draft' && p.stock > 0 && p.stock <= 10),
    [products]
  );
  const pendingReview = useMemo(
    () => (products ?? []).filter((p) => p.approvalStatus === 'pending'),
    [products]
  );

  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });

  if (loading) {
    return <div className="animate-pulse font-heading text-xl text-neutral-700">Loading your dashboard…</div>;
  }

  if (error) {
    const message = error instanceof Error ? error.message : 'Something went wrong reaching Arghya. Try refreshing the page.';
    return (
      <EmptyState
        title="Couldn't load your dashboard"
        description={message}
        action={<Button onClick={() => window.location.reload()}>Retry</Button>}
      />
    );
  }

  if (!stats || !products) return null;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end gap-3.5">
        <div>
          <h1 className="text-2xl md:text-3xl">Today</h1>
          <div className="mt-1 text-xs text-neutral-700">
            {today} · {stats.toDispatch.length} order{stats.toDispatch.length === 1 ? '' : 's'} need
            {stats.toDispatch.length === 1 ? 's' : ''} you
          </div>
        </div>
        <div className="ml-auto flex gap-2.5">
          <Button as={Link} to="/listings" variant="quiet">
            My listings
          </Button>
          <Button as={Link} to="/listings/new">
            + New listing
          </Button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3.5 md:grid-cols-4">
        <Card className="p-4">
          <div className="text-[11px] uppercase tracking-wider text-neutral-700">Sales today</div>
          <div className="mt-1.5 font-heading text-2xl">{inr(stats.salesToday)}</div>
        </Card>
        <Card className="border border-accent-300 bg-accent-100 p-4">
          <div className="text-[11px] uppercase tracking-wider text-accent-800">To dispatch</div>
          <div className="mt-1.5 font-heading text-2xl text-accent-800">{stats.toDispatch.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-[11px] uppercase tracking-wider text-neutral-700">Listings</div>
          <div className="mt-1.5 font-heading text-2xl">{(products ?? []).length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-[11px] uppercase tracking-wider text-neutral-700">In moderation</div>
          <div className="mt-1.5 font-heading text-2xl">{pendingReview.length}</div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Card className="p-5">
          <div className="mb-2.5 flex items-baseline justify-between">
            <h2 className="text-lg">Orders to dispatch</h2>
            <Link to="/orders" className="text-xs font-bold">
              All {stats.toDispatch.length}
            </Link>
          </div>
          {stats.toDispatch.length === 0 ? (
            <EmptyState
              title="Nothing to dispatch"
              description="New orders will show up here as soon as they come in."
            />
          ) : (
            <div className="overflow-x-auto">
              <table>
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Item</th>
                    <th>Order value</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {stats.toDispatch.slice(0, 5).map((order) => (
                    <tr key={order.id}>
                      <td>
                        <Link to={`/orders/${order.id}`} className="font-bold">
                          {order.id.slice(0, 8).toUpperCase()}
                        </Link>
                      </td>
                      <td>{order.items.map((i) => i.productName).join(', ')}</td>
                      <td>{inr(order.total)}</td>
                      <td>
                        <Link to={`/orders/${order.id}`} className="text-xs font-bold">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <div className="flex flex-col gap-4">
          {lowStock.length > 0 && (
            <Card className="border border-accent-2-300 bg-accent-2-100 p-5">
              <h2 className="text-lg text-accent-2-900">Running low</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-accent-2-900">
                {lowStock.length} listing{lowStock.length === 1 ? '' : 's'} have 10 units or fewer left.
              </p>
              <Button
                as={Link}
                to="/inventory"
                variant="ghost"
                className="mt-3 w-full border-accent-2-700 text-accent-2-900"
              >
                Update stock
              </Button>
            </Card>
          )}
          <Card className="p-5">
            <h2 className="mb-3 text-lg">Your best sellers</h2>
            {stats.bestSellers.length === 0 ? (
              <p className="text-sm text-neutral-700">Best sellers will appear once orders come in.</p>
            ) : (
              <div className="flex flex-col gap-2.5 text-sm">
                {stats.bestSellers.map(([name, qty]) => (
                  <div key={name} className="flex justify-between">
                    <span>{name}</span>
                    <strong>{qty}</strong>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {pendingReview.length > 0 && (
        <p className="mt-6 text-xs text-neutral-700">
          {pendingReview.length} listing{pendingReview.length === 1 ? ' is' : 's are'} waiting on moderation.{' '}
          <Link to="/listings" className="font-bold">
            Review them
          </Link>
          .
        </p>
      )}
    </div>
  );
}
