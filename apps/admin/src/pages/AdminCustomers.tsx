import { Card, EmptyState } from '@arghya/ui';
import { inr } from '@arghya/utils';
import AdminLayout from '../components/AdminLayout.js';
import { api } from '../lib/api.js';
import { useAsync } from '../lib/useAsync.js';

interface CustomerRow {
  name: string;
  orders: number;
  spend: number;
}

// There is no admin customers-list endpoint on the backend (checked
// admin.routes.js / admin.service.js — nothing customer- or profile-facing
// beyond what an order embeds). Rather than fabricate a directory, this page
// says so plainly and offers the one honest thing the order data supports: a
// tally of names that show up in orders. No email, phone or account list is
// available from here.
export default function AdminCustomers() {
  const { data, loading, error } = useAsync(() => api.adminOrders(), []);
  const items = data?.items ?? [];

  const byName = new Map<string, CustomerRow>();
  for (const o of items) {
    const name = o.customerName ?? 'Guest';
    if (!byName.has(name)) byName.set(name, { name, orders: 0, spend: 0 });
    const row = byName.get(name)!;
    row.orders += 1;
    row.spend += Number(o.total ?? 0);
  }
  const rows = [...byName.values()].sort((a, b) => b.spend - a.spend);

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl">Customers</h1>
        <div className="mt-0.5 text-xs text-neutral-700">No customer directory endpoint yet</div>
      </div>

      <Card className="mb-5 p-5">
        <EmptyState
          title="There is no customer directory yet"
          description="The API has no admin endpoint for listing customer accounts, contact details or lifetime value — only what an individual order embeds. Building this needs a new backend route before this screen can show real profiles."
        />
      </Card>

      <Card className="p-5">
        <h2 className="mb-1 text-lg">Names seen in orders</h2>
        <p className="mb-3 text-xs text-neutral-700">
          Derived from order history only — not a customer directory. No phone, email or account
          status is available here.
        </p>
        {loading ? (
          <p className="text-sm text-neutral-700">Loading…</p>
        ) : error ? (
          <p className="text-sm text-neutral-700">Orders could not be loaded.</p>
        ) : rows.length === 0 ? (
          <EmptyState title="No orders yet" />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name on order</th>
                <th>Orders</th>
                <th>Total spend</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.name}>
                  <td>{r.name}</td>
                  <td>{r.orders}</td>
                  <td>{inr(r.spend)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </AdminLayout>
  );
}
