'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ApiError } from '@arghya/api-client';
import { Button, EmptyState, Tag } from '@arghya/ui';
import { inr, orderStatusMeta } from '@arghya/utils';
import { useAuth } from '../../../context/AuthContext.js';
import { api } from '../../../lib/api.js';
import type { CustomerOrder } from '../../../lib/serverTypes.js';

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&q=80&w=800';

function shortId(id: string): string {
  return id ? String(id).slice(0, 8).toUpperCase() : '';
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' });
}

export function OrderDetailClient({
  orderId,
  justPlaced,
  siblingOrderIds = [],
}: {
  orderId: string;
  justPlaced?: boolean;
  siblingOrderIds?: string[];
}) {
  const { userRole, loading: authLoading } = useAuth();
  const router = useRouter();
  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!authLoading && userRole !== 'customer') {
      router.replace(`/sign-in?next=/orders/${orderId}`);
    }
  }, [authLoading, userRole, router, orderId]);

  useEffect(() => {
    if (authLoading || userRole !== 'customer') return;
    let active = true;
    (async () => {
      try {
        const data = (await api.order(orderId)) as unknown as CustomerOrder;
        if (active) setOrder(data);
      } catch (err) {
        if (active) setError(err instanceof ApiError ? err.message : 'Failed to load order.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [authLoading, userRole, orderId]);

  const handleCancel = async () => {
    if (cancelling || !order) return;
    setCancelling(true);
    try {
      await api.cancelOrder(order.id);
      setOrder((prev) => (prev ? { ...prev, status: 'cancelled' } : prev));
      setConfirmingCancel(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to cancel order.');
      setConfirmingCancel(false);
    } finally {
      setCancelling(false);
    }
  };

  if (authLoading || userRole !== 'customer') {
    return <div className="px-4 md:px-11 py-6 max-w-[1000px] mx-auto w-full text-sm text-neutral-700">Checking your session…</div>;
  }

  const address = order?.shipping_address ?? null;
  const cancellable = order && ['pending', 'paid'].includes(order.status);
  const tag = order ? orderStatusMeta(order.status) : null;

  return (
    <div className="px-4 md:px-11 py-6 max-w-[1000px] mx-auto w-full">
      <Link href="/orders" className="text-[13px] font-bold">
        ← Back to your orders
      </Link>

      {loading && <p className="text-sm text-neutral-700 mt-6">Loading order…</p>}

      {!loading && error && !order && (
        <div className="mt-6">
          <EmptyState title="Could not load this order" description={error} />
        </div>
      )}

      {!loading && order && (
        <>
          {justPlaced && (
            <div className="mt-5 p-5 rounded-3xl bg-accent-2-100 border border-accent-2-300 flex items-center gap-3.5">
              <span className="w-11 h-11 rounded-full bg-accent-2-500 text-accent-900 grid place-items-center text-xl shrink-0">
                ✓
              </span>
              <div>
                <div className="font-heading text-[19px] text-accent-2-900">Your puja is booked</div>
                <div className="text-[13px] text-accent-2-900">Order #{shortId(order.id)} · paid {inr(order.total)}</div>
              </div>
            </div>
          )}

          {justPlaced && siblingOrderIds.length > 0 && (
            <div className="mt-3 p-4 rounded-2xl bg-surface border border-divider text-sm text-neutral-800">
              Your cart spanned {siblingOrderIds.length + 1} stores, so it was split into {siblingOrderIds.length + 1}{' '}
              orders — this is one of them. The others:{' '}
              {siblingOrderIds.map((sid, i) => (
                <span key={sid}>
                  {i > 0 && ', '}
                  <Link href={`/orders/${sid}?placed=1`} className="font-bold">
                    #{shortId(sid)}
                  </Link>
                </span>
              ))}
              .
            </div>
          )}

          <div className="flex items-center justify-between gap-4 flex-wrap mt-6 mb-5">
            <div>
              <h1 className="text-2xl m-0">Order #{shortId(order.id)}</h1>
              <p className="text-sm text-neutral-700 m-0 mt-1">Placed on {formatDate(order.created_at)}</p>
            </div>
            {tag && <Tag variant={tag.variant}>{tag.label}</Tag>}
          </div>

          <div className="grid md:grid-cols-[1fr_320px] gap-6">
            <div className="p-5 rounded-3xl bg-surface">
              <h2 className="text-lg m-0 mb-4">Items</h2>
              {order.items?.length === 0 && <p className="text-sm text-neutral-700">No items on this order.</p>}
              <div className="flex flex-col">
                {order.items?.map((item) => (
                  <div key={item.id} className="flex items-center gap-3.5 py-3 border-b border-divider last:border-b-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.coverImage || FALLBACK_IMG}
                      alt={item.productName}
                      className="w-14 h-14 rounded-xl object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate m-0">{item.productName}</p>
                      <p className="text-xs text-neutral-700 m-0 mt-0.5">
                        {inr(item.unitPrice)}
                        {item.discountPercent > 0 && <span className="text-accent-2-700"> · -{item.discountPercent}%</span>}
                        {' × '}
                        {item.quantity}
                      </p>
                    </div>
                    <strong className="shrink-0">{inr(item.lineTotal)}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="p-5 rounded-3xl bg-surface">
                <h2 className="text-base m-0 mb-3">Summary</h2>
                <div className="flex flex-col gap-2 text-sm">
                  <div className="flex justify-between text-neutral-700">
                    <span>Subtotal</span>
                    <span>{inr(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-[16px] pt-2 mt-1 border-t border-divider">
                    <span>Total</span>
                    <span>{inr(order.total)}</span>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-surface">
                <h2 className="text-base m-0 mb-3">Delivering to</h2>
                {address ? (
                  <div className="text-sm leading-relaxed">
                    <p className="font-bold m-0">{[address.firstName, address.lastName].filter(Boolean).join(' ') || 'Recipient'}</p>
                    <p className="text-neutral-700 m-0 mt-1">{address.address}</p>
                    <p className="text-neutral-700 m-0">{[address.city, address.pin].filter(Boolean).join(', ')}</p>
                    {address.phone && <p className="text-neutral-700 m-0 mt-1">{address.phone}</p>}
                  </div>
                ) : (
                  <p className="text-sm text-neutral-700 m-0">No shipping address recorded.</p>
                )}
              </div>

              {cancellable && (
                <div className="p-5 rounded-3xl bg-surface">
                  {confirmingCancel ? (
                    <>
                      <h3 className="text-base m-0 mb-1 text-accent-800">Cancel this order?</h3>
                      <p className="text-xs text-neutral-700 leading-relaxed mb-3.5">
                        This will cancel the order and release any reserved stock.
                      </p>
                      <div className="flex gap-2.5">
                        <Button
                          type="button"
                          disabled={cancelling}
                          onClick={handleCancel}
                          className="flex-1 min-h-[38px] text-[13px]"
                        >
                          {cancelling ? 'Cancelling…' : 'Yes, cancel'}
                        </Button>
                        <Button
                          type="button"
                          variant="quiet"
                          disabled={cancelling}
                          onClick={() => setConfirmingCancel(false)}
                          className="min-h-[38px] text-[13px]"
                        >
                          Keep order
                        </Button>
                      </div>
                    </>
                  ) : (
                    <Button type="button" variant="quiet" onClick={() => setConfirmingCancel(true)} className="w-full min-h-[38px] text-[13px]">
                      Cancel order
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
