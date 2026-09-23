import { useState } from 'react';
import { Button, Card, EmptyState, useToastStore } from '@arghya/ui';
import { inr } from '@arghya/utils';
import AdminLayout from '../components/AdminLayout.js';
import { api, ApiError } from '../lib/api.js';
import { useAsync } from '../lib/useAsync.js';
import { formatDate } from '../lib/format.js';
import type { AdminLedgerResponse, AdminLedgerSellerRow } from '../lib/adminTypes.js';

export default function AdminCommissions() {
  const addToast = useToastStore((s) => s.addToast);
  // adminLedger() is declared to resolve the shared, narrower Ledger shape
  // (summary + sellers only); the real /admin/ledger endpoint also returns
  // feeRate, asOf, settlements, and richer per-seller rows this screen
  // renders — see lib/adminTypes.ts.
  const { data: ledger, loading, error, reload } = useAsync(
    () => api.adminLedger() as unknown as Promise<AdminLedgerResponse>,
    []
  );
  const [settlingId, setSettlingId] = useState<string | null>(null);

  async function handleSettle(seller: AdminLedgerSellerRow) {
    const orderIds = seller.unsettledOrders.map((o) => o.id);
    if (orderIds.length === 0) return;
    const note =
      window.prompt(
        `Note for this settlement to ${seller.name} (optional):`,
        `Manual payout · ${orderIds.length} orders`
      ) ?? undefined;
    setSettlingId(seller.id);
    try {
      await api.adminCreateSettlement(seller.id, orderIds, note || undefined);
      addToast(`Settlement recorded for ${seller.name}.`, 'success');
      reload();
    } catch (err) {
      addToast(err instanceof ApiError ? err.message : 'Could not record this settlement.', 'error');
    } finally {
      setSettlingId(null);
    }
  }

  const summary = ledger?.summary;
  const sellers = ledger?.sellers ?? [];
  const settlements = ledger?.settlements ?? [];

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl">Commission & payouts</h1>
        <div className="mt-0.5 text-xs text-neutral-700">
          {loading || !ledger
            ? 'Loading…'
            : `Flat ${(ledger.feeRate * 100).toFixed(0)}% platform fee · as of ${formatDate(ledger.asOf)}`}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-neutral-700">Loading ledger…</p>
      ) : error || !summary ? (
        <Card className="p-5">
          <EmptyState
            title="Could not load the ledger"
            description={error?.message || 'The server did not respond. Try again shortly.'}
          />
        </Card>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
            <Card className="p-4">
              <div className="text-[11px] uppercase tracking-wider text-neutral-700">Gross sales</div>
              <div className="mt-1.5 font-heading text-2xl">{inr(summary.grossSales)}</div>
              <div className="mt-0.5 text-xs text-neutral-700">{summary.orders} paid orders</div>
            </Card>
            <Card className="p-4">
              <div className="text-[11px] uppercase tracking-wider text-neutral-700">Platform fees</div>
              <div className="mt-1.5 font-heading text-2xl">{inr(summary.platformFees)}</div>
            </Card>
            <Card className="p-4">
              <div className="text-[11px] uppercase tracking-wider text-neutral-700">Seller payouts</div>
              <div className="mt-1.5 font-heading text-2xl">{inr(summary.sellerPayouts)}</div>
              <div className="mt-0.5 text-xs text-neutral-700">{inr(summary.settledPayouts)} already settled</div>
            </Card>
            <Card className="border border-accent-300 bg-accent-100 p-4">
              <div className="text-[11px] uppercase tracking-wider text-accent-800">Unsettled payouts</div>
              <div className="mt-1.5 font-heading text-2xl text-accent-800">
                {inr(summary.unsettledPayouts)}
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.3fr_1fr]">
            <Card className="p-5">
              <h2 className="mb-3 text-lg">Sellers this period</h2>
              {sellers.length === 0 ? (
                <EmptyState title="No seller sales yet" />
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Seller</th>
                      <th>Gross</th>
                      <th>Fee</th>
                      <th>Unsettled payout</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {sellers.map((s) => (
                      <tr key={s.id}>
                        <td>
                          <div className="font-bold">{s.name}</div>
                          <div className="text-xs text-neutral-700">
                            {s.sellerName ?? '—'} · {s.orderCount} orders
                          </div>
                        </td>
                        <td>{inr(s.gross)}</td>
                        <td>{inr(s.fee)}</td>
                        <td>
                          <strong>{inr(s.unsettledPayout)}</strong>
                          {s.unsettledOrders.length > 0 && (
                            <div className="text-xs text-neutral-700">
                              {s.unsettledOrders.length} orders
                            </div>
                          )}
                        </td>
                        <td className="text-right">
                          <Button
                            variant="quiet"
                            className="min-h-[32px] px-3 text-xs"
                            disabled={s.unsettledOrders.length === 0 || settlingId === s.id}
                            onClick={() => handleSettle(s)}
                          >
                            {settlingId === s.id ? 'Settling…' : 'Settle'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>

            <Card className="p-5">
              <h2 className="mb-3 text-lg">Recent settlements</h2>
              {settlements.length === 0 ? (
                <EmptyState title="No settlements recorded yet" />
              ) : (
                <div className="flex flex-col gap-2.5">
                  {settlements.map((s) => (
                    <div key={s.id} className="rounded-2xl bg-neutral-100 px-3.5 py-2.5 text-sm">
                      <div className="flex justify-between">
                        <strong>{s.storeName}</strong>
                        <span>{inr(s.net)}</span>
                      </div>
                      <div className="mt-0.5 text-xs text-neutral-700">
                        {formatDate(s.createdAt)} · {s.orderCount} orders
                        {s.createdBy ? ` · by ${s.createdBy}` : ''}
                      </div>
                      {s.note && <div className="mt-1 text-xs text-neutral-700">{s.note}</div>}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
