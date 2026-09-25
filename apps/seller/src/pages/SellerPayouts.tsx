import { useEffect, useMemo, useState } from 'react';
import { Button, Card, EmptyState } from '@arghya/ui';
import { inr } from '@arghya/utils';
import type { OrderStatus } from '@arghya/api-client';
import { api, type SellerOrder } from '../lib/api.js';

const COUNTED_STATUSES = new Set<OrderStatus>(['paid', 'shipped', 'delivered']);

export default function SellerPayouts() {
  const [orders, setOrders] = useState<SellerOrder[] | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const { items } = await api.sellerOrders();
      setOrders(items);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => {
    if (!orders) return null;
    const counted = orders.filter((o) => COUNTED_STATUSES.has(o.status));
    const delivered = counted.filter((o) => o.status === 'delivered');
    const gross = counted.reduce((sum, o) => sum + o.total, 0);
    const deliveredGross = delivered.reduce((sum, o) => sum + o.total, 0);
    return { counted, delivered, gross, deliveredGross };
  }, [orders]);

  if (loading) {
    return <div className="animate-pulse font-heading text-xl text-neutral-700">Loading payouts…</div>;
  }

  if (error) {
    const message = error instanceof Error ? error.message : 'Something went wrong reaching Arghya.';
    return (
      <EmptyState
        title="Couldn't load your payout figures"
        description={message}
        action={<Button onClick={load}>Retry</Button>}
      />
    );
  }

  if (!stats) return null;

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl md:text-3xl">Payouts</h1>
        <div className="mt-1 text-xs text-neutral-700">
          Figures below are computed from your paid orders — Arghya's settlement ledger for sellers is
          coming soon.
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3.5 md:grid-cols-4">
        <Card className="p-4">
          <div className="text-[11px] uppercase tracking-wider text-neutral-700">Gross, paid orders</div>
          <div className="mt-1.5 font-heading text-2xl">{inr(stats.gross)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-[11px] uppercase tracking-wider text-neutral-700">Delivered gross</div>
          <div className="mt-1.5 font-heading text-2xl">{inr(stats.deliveredGross)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-[11px] uppercase tracking-wider text-neutral-700">Orders counted</div>
          <div className="mt-1.5 font-heading text-2xl">{stats.counted.length}</div>
        </Card>
        <Card className="border border-dashed border-divider p-4">
          <div className="text-[11px] uppercase tracking-wider text-neutral-700">Next payout</div>
          <div className="mt-1.5 font-heading text-lg text-neutral-700">Coming soon</div>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <Card className="p-5">
          <h2 className="mb-1 text-lg">Settlement statements</h2>
          <p className="mb-4 text-xs text-neutral-700">
            Per-cycle statements, commission breakdowns and return deductions aren't available to
            sellers yet — an admin can currently record a settlement on your behalf.
          </p>
          {stats.counted.length === 0 ? (
            <EmptyState
              title="No paid orders yet"
              description="Once customers pay for your orders, they'll be counted here."
            />
          ) : (
            <div className="overflow-x-auto">
              <table>
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Status</th>
                    <th>Placed</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.counted.map((order) => (
                    <tr key={order.id}>
                      <td className="font-bold">{order.id.slice(0, 8).toUpperCase()}</td>
                      <td className="capitalize text-neutral-700">{order.status}</td>
                      <td className="text-neutral-700">{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td>{inr(order.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <div className="rounded-2xl border border-dashed border-divider p-5 text-sm text-neutral-700">
          <h2 className="mb-2 text-base text-text">Settlement account</h2>
          Bank account details, commission rates and payout scheduling aren't stored yet — this section
          is coming soon.
        </div>
      </div>
    </div>
  );
}
