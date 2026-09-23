import { Card, EmptyState, Tag } from '@arghya/ui';
import type { TagVariant } from '@arghya/ui';
import { inr } from '@arghya/utils';
import type { Product } from '@arghya/api-client';
import AdminLayout from '../components/AdminLayout.js';
import { api } from '../lib/api.js';
import { useAsync } from '../lib/useAsync.js';

// Every product belongs to exactly one store in this schema (no multi-store
// stock split per SKU), so "inventory by store" is grouped sections rather
// than the per-store pivot columns a chain retailer's mockup might show.
const LOW_STOCK_THRESHOLD = 20;

interface StockTag {
  variant: TagVariant;
  label: string;
}

function stockTag(stock: number): StockTag {
  if (stock === 0) return { variant: 'warn', label: 'Out of stock' };
  if (stock < LOW_STOCK_THRESHOLD) return { variant: 'warn', label: 'Low stock' };
  return { variant: 'live', label: 'Healthy' };
}

const FETCH_PAGE_SIZE = 200;

// This screen shows the complete inventory grouped by store, not a
// browsable page at a time — paging through it would split stores across
// pages and make the totals lie. adminProducts() only returns one page, so
// fetch every page and concatenate rather than capping at the first one.
async function loadAllProducts(): Promise<Product[]> {
  const items: Product[] = [];
  let page = 1;
  for (;;) {
    const res = await api.adminProducts(undefined, { page, limit: FETCH_PAGE_SIZE });
    items.push(...res.items);
    if (items.length >= res.total || res.items.length === 0) break;
    page += 1;
  }
  return items;
}

export default function AdminInventory() {
  const { data, loading, error } = useAsync(loadAllProducts, []);
  const items = data ?? [];

  const byStore = new Map<string, Product[]>();
  for (const p of items) {
    const key = p.storeName ?? 'Unassigned';
    if (!byStore.has(key)) byStore.set(key, []);
    byStore.get(key)!.push(p);
  }
  const stores = [...byStore.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  const lowStockCount = items.filter((p) => p.stock < LOW_STOCK_THRESHOLD).length;

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl">Inventory by store</h1>
        <div className="mt-0.5 text-xs text-neutral-700">
          {loading
            ? 'Loading…'
            : `${items.length} SKUs across ${stores.length} stores · ${lowStockCount} low or out of stock`}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-neutral-700">Loading inventory…</p>
      ) : error ? (
        <Card className="p-5">
          <EmptyState
            title="Could not load inventory"
            description={error.message || 'The server did not respond. Try again shortly.'}
          />
        </Card>
      ) : stores.length === 0 ? (
        <Card className="p-5">
          <EmptyState title="No products yet" />
        </Card>
      ) : (
        <div className="flex flex-col gap-5">
          {stores.map(([storeName, products]) => (
            <Card key={storeName} className="p-5">
              <h2 className="mb-3 text-lg">{storeName}</h2>
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Category</th>
                    <th>Sale price</th>
                    <th>Stock</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => {
                    const tag = stockTag(p.stock);
                    return (
                      <tr key={p.id}>
                        <td>{p.name}</td>
                        <td>{p.category?.name ?? '—'}</td>
                        <td>{inr(p.salePrice)}</td>
                        <td>{p.stock}</td>
                        <td>
                          <Tag variant={tag.variant}>{tag.label}</Tag>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
