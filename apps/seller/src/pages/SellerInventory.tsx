import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { Button, EmptyState, Tag, useToastStore } from '@arghya/ui';
import { api, type SellerProduct } from '../lib/api.js';

function stockTag(stock: number) {
  if (stock === 0) return <Tag variant="mute">Out of stock</Tag>;
  if (stock <= 10) return <Tag variant="warn">Low stock</Tag>;
  return <Tag variant="live">Healthy</Tag>;
}

export default function SellerInventory() {
  const [products, setProducts] = useState<SellerProduct[] | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const { items } = await api.sellerProducts();
      setProducts(items);
      setEdits({});
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

  const dirtyIds = useMemo(
    () =>
      Object.entries(edits).filter(([id, value]) => {
        const product = products?.find((p) => p.id === id);
        return product && Number(value) !== product.stock && value !== '';
      }),
    [edits, products]
  );

  const handleChange = (id: string, value: string) => setEdits((e) => ({ ...e, [id]: value }));

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      await Promise.all(dirtyIds.map(([id, value]) => api.updateProduct(id, { stock: Number(value) })));
      useToastStore.getState().addToast('Stock updated', 'success');
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not save every stock change';
      useToastStore.getState().addToast(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse font-heading text-xl text-neutral-700">Loading inventory…</div>;
  }

  if (error) {
    const message = error instanceof Error ? error.message : 'Something went wrong reaching Arghya.';
    return (
      <EmptyState
        title="Couldn't load your inventory"
        description={message}
        action={<Button onClick={load}>Retry</Button>}
      />
    );
  }

  if (!products) return null;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end gap-3.5">
        <div>
          <h1 className="text-2xl md:text-3xl">Inventory</h1>
          <div className="mt-1 text-xs text-neutral-700">Type a new number and save.</div>
        </div>
        <Button onClick={handleSaveAll} disabled={saving || dirtyIds.length === 0} className="ml-auto">
          {saving ? 'Saving…' : `Save stock${dirtyIds.length ? ` (${dirtyIds.length})` : ''}`}
        </Button>
      </div>

      {products.length === 0 ? (
        <EmptyState
          title="No listings yet"
          description="Once you have listings, their stock levels show up here."
        />
      ) : (
        <div className="overflow-x-auto rounded-3xl bg-surface p-1">
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Stock on hand</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>
                    <strong>{product.name}</strong>
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      aria-label={`Stock for ${product.name}`}
                      value={edits[product.id] ?? product.stock}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange(product.id, e.target.value)}
                      className="min-h-[36px] w-28 rounded-full border border-divider bg-bg px-3 text-sm outline-none focus:border-accent"
                    />
                  </td>
                  <td>{stockTag(Number(edits[product.id] ?? product.stock))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-5 text-xs leading-relaxed text-neutral-700">
        An out-of-stock listing is hidden from the shop, not cancelled at checkout. If you can't
        dispatch an accepted order, cancel it from the order instead of zeroing stock after the sale.
      </p>
    </div>
  );
}
