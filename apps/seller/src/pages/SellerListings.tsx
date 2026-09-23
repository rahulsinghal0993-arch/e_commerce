import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, EmptyState, Tag, TabGroup, useToastStore } from '@arghya/ui';
import { inr } from '@arghya/utils';
import { api, type SellerProduct } from '../lib/api.js';

interface ListingTab {
  key: string;
  label: string;
  match: (product: SellerProduct) => boolean;
}

const TABS: ListingTab[] = [
  { key: 'all', label: 'All', match: () => true },
  { key: 'live', label: 'Live', match: (p) => p.approvalStatus === 'approved' && p.status === 'active' },
  { key: 'moderation', label: 'In moderation', match: (p) => p.approvalStatus === 'pending' },
  { key: 'rejected', label: 'Rejected', match: (p) => p.approvalStatus === 'rejected' },
  { key: 'out', label: 'Out of stock', match: (p) => p.stock === 0 },
];

function statusTag(product: SellerProduct) {
  if (product.approvalStatus === 'pending') return <Tag variant="warn">In moderation</Tag>;
  if (product.approvalStatus === 'rejected') return <Tag variant="mute">Rejected</Tag>;
  if (product.stock === 0) return <Tag variant="mute">Out of stock</Tag>;
  if (product.stock <= 10) return <Tag variant="warn">Low stock</Tag>;
  if (product.status === 'draft') return <Tag variant="mute">Draft</Tag>;
  return <Tag variant="live">Live</Tag>;
}

export default function SellerListings() {
  const [products, setProducts] = useState<SellerProduct[] | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    try {
      const { items } = await api.sellerProducts();
      setProducts(items);
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

  const filtered = useMemo(() => {
    if (!products) return [];
    const active = TABS.find((t) => t.key === tab) ?? TABS[0]!;
    return products.filter(active.match);
  }, [products, tab]);

  const handleDelete = async (product: SellerProduct) => {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    setBusyId(product.id);
    try {
      await api.deleteProduct(product.id);
      useToastStore.getState().addToast('Listing deleted', 'success');
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not delete this listing';
      useToastStore.getState().addToast(message, 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleResubmit = async (product: SellerProduct) => {
    setBusyId(product.id);
    try {
      await api.resubmitProduct(product.id);
      useToastStore.getState().addToast('Resubmitted for review', 'success');
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not resubmit this listing';
      useToastStore.getState().addToast(message, 'error');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return <div className="animate-pulse font-heading text-xl text-neutral-700">Loading listings…</div>;
  }

  if (error) {
    const message = error instanceof Error ? error.message : 'Something went wrong reaching Arghya.';
    return (
      <EmptyState
        title="Couldn't load your listings"
        description={message}
        action={<Button onClick={load}>Retry</Button>}
      />
    );
  }

  if (!products) return null;

  const moderationCount = products.filter((p) => p.approvalStatus === 'pending').length;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end gap-3.5">
        <div>
          <h1 className="text-2xl md:text-3xl">Listings</h1>
          <div className="mt-1 text-xs text-neutral-700">
            {products.length} SKU{products.length === 1 ? '' : 's'}
            {moderationCount > 0 && ` · ${moderationCount} in moderation`}
          </div>
        </div>
        <Button as={Link} to="/listings/new" className="ml-auto">
          + New listing
        </Button>
      </div>

      <TabGroup className="mb-5" options={TABS} value={tab} onChange={setTab} />

      {products.length === 0 ? (
        <EmptyState
          title="No listings yet"
          description="Add your first product and it goes live once it's reviewed."
          action={
            <Button as={Link} to="/listings/new">
              + New listing
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState title="Nothing here" description="No listings match this filter." />
      ) : (
        <div className="overflow-x-auto rounded-3xl bg-surface p-1">
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Shelf price</th>
                <th>Stock</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => (
                <tr key={product.id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      {product.coverImage ? (
                        <img
                          src={product.coverImage}
                          alt=""
                          className="h-9 w-9 shrink-0 rounded-xl object-cover"
                        />
                      ) : (
                        <span className="ph h-9 w-9 shrink-0 rounded-xl text-[9px]">No img</span>
                      )}
                      <strong>{product.name}</strong>
                    </div>
                  </td>
                  <td>{inr(product.salePrice)}</td>
                  <td>{product.stock}</td>
                  <td>{statusTag(product)}</td>
                  <td>
                    <div className="flex justify-end gap-3 text-xs font-bold">
                      <Link to={`/listings/${product.id}/edit`}>Edit</Link>
                      {product.approvalStatus === 'rejected' && (
                        <button
                          type="button"
                          disabled={busyId === product.id}
                          onClick={() => handleResubmit(product)}
                          className="text-accent-700 disabled:opacity-50"
                        >
                          Resubmit
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={busyId === product.id}
                        onClick={() => handleDelete(product)}
                        className="text-accent-700 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
