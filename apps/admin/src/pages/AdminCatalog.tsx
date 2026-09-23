import { useState, type FormEvent } from 'react';
import { Button, Card, EmptyState, Tag, TextField, TabGroup, useToastStore, type TabGroupOption, type TagVariant } from '@arghya/ui';
import { inr } from '@arghya/utils';
import type { ProductApprovalStatus } from '@arghya/api-client';
import AdminLayout from '../components/AdminLayout.js';
import { api, ApiError } from '../lib/api.js';
import { useAsync } from '../lib/useAsync.js';
import type { CategoryListResponse } from '../lib/adminTypes.js';

type FilterKey = ProductApprovalStatus | '';

const FILTERS: TabGroupOption[] = [
  { key: '', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

const PAGE_SIZE = 50;

const APPROVAL_VARIANT: Record<ProductApprovalStatus, TagVariant> = {
  pending: 'warn',
  approved: 'live',
  rejected: 'mute',
};

export default function AdminCatalog() {
  const addToast = useToastStore((s) => s.addToast);
  const [filter, setFilter] = useState<FilterKey>('');
  const [page, setPage] = useState(1);
  const products = useAsync(
    () => api.adminProducts(filter || undefined, { page, limit: PAGE_SIZE }),
    [filter, page]
  );
  // adminCategories() is declared to resolve a bare Category[], but the real
  // endpoint answers `{ items: [...] }` with a productCount per row (see
  // lib/adminTypes.ts) — cast to the shape this screen actually receives.
  const categories = useAsync(
    () => api.adminCategories() as unknown as Promise<CategoryListResponse>,
    []
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);

  const productItems = products.data?.items ?? [];
  const categoryItems = categories.data?.items ?? [];
  const total = products.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function handleFilterChange(key: string) {
    setFilter(key as FilterKey);
    setPage(1);
  }

  async function handleApprove(id: string) {
    setBusyId(id);
    try {
      await api.adminSetProductApproval(id, 'approve');
      addToast('Listing approved.', 'success');
      products.reload();
    } catch (err) {
      addToast(err instanceof ApiError ? err.message : 'Could not approve the listing.', 'error');
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(id: string) {
    const reason = window.prompt('Reason for rejecting this listing (shown to the seller):') || undefined;
    setBusyId(id);
    try {
      await api.adminSetProductApproval(id, 'reject', reason);
      addToast('Listing rejected.', 'success');
      products.reload();
    } catch (err) {
      addToast(err instanceof ApiError ? err.message : 'Could not reject the listing.', 'error');
    } finally {
      setBusyId(null);
    }
  }

  async function handleDeleteProduct(id: string, name: string) {
    if (!window.confirm(`Remove "${name}" from the marketplace? This cannot be undone.`)) return;
    setBusyId(id);
    try {
      await api.adminDeleteProduct(id);
      addToast('Listing removed.', 'success');
      products.reload();
    } catch (err) {
      addToast(err instanceof ApiError ? err.message : 'Could not remove the listing.', 'error');
    } finally {
      setBusyId(null);
    }
  }

  async function handleCreateCategory(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!newCategory.trim()) return;
    setCreatingCategory(true);
    try {
      await api.createCategory(newCategory.trim());
      addToast('Category added.', 'success');
      setNewCategory('');
      categories.reload();
    } catch (err) {
      addToast(err instanceof ApiError ? err.message : 'Could not create the category.', 'error');
    } finally {
      setCreatingCategory(false);
    }
  }

  async function handleDeleteCategory(id: string, name: string) {
    if (!window.confirm(`Delete category "${name}"? Its products keep selling, uncategorised.`)) return;
    try {
      await api.deleteCategory(id);
      addToast('Category deleted.', 'success');
      categories.reload();
    } catch (err) {
      addToast(err instanceof ApiError ? err.message : 'Could not delete the category.', 'error');
    }
  }

  return (
    <AdminLayout>
      <div className="mb-6 flex flex-wrap items-end gap-3">
        <div>
          <h1 className="text-2xl">Catalog</h1>
          <div className="mt-0.5 text-xs text-neutral-700">
            {products.loading
              ? 'Loading…'
              : `${total} listing${total === 1 ? '' : 's'} · page ${page} of ${totalPages}`}
          </div>
        </div>
        <TabGroup className="ml-auto" options={FILTERS} value={filter} onChange={handleFilterChange} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
        <Card className="p-5">
          {products.loading ? (
            <p className="text-sm text-neutral-700">Loading listings…</p>
          ) : products.error ? (
            <EmptyState
              title="Could not load the catalog"
              description={products.error.message || 'The server did not respond. Try again shortly.'}
            />
          ) : productItems.length === 0 ? (
            <EmptyState title="No listings match this filter" />
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Store</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {productItems.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="font-bold">{p.name}</div>
                      <div className="text-xs text-neutral-700">{p.category?.name ?? 'Uncategorised'}</div>
                    </td>
                    <td>{p.storeName ?? '—'}</td>
                    <td>
                      <strong>{inr(p.salePrice)}</strong>
                      {p.discount_percent > 0 && (
                        <div className="text-xs text-neutral-700 line-through">{inr(p.price)}</div>
                      )}
                    </td>
                    <td>{p.stock}</td>
                    <td>
                      <Tag variant={APPROVAL_VARIANT[p.approvalStatus] ?? 'mute'}>
                        {p.approvalStatus}
                      </Tag>
                      {p.rejectionReason && (
                        <div className="mt-1 text-xs text-neutral-700">{p.rejectionReason}</div>
                      )}
                    </td>
                    <td className="whitespace-nowrap">
                      <div className="flex justify-end gap-1.5">
                        {p.approvalStatus === 'pending' && (
                          <>
                            <Button
                              variant="quiet"
                              className="min-h-[32px] px-3 text-xs"
                              disabled={busyId === p.id}
                              onClick={() => handleReject(p.id)}
                            >
                              Reject
                            </Button>
                            <Button
                              variant="solid"
                              className="min-h-[32px] px-3 text-xs"
                              disabled={busyId === p.id}
                              onClick={() => handleApprove(p.id)}
                            >
                              Approve
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          className="min-h-[32px] px-3 text-xs"
                          disabled={busyId === p.id}
                          onClick={() => handleDeleteProduct(p.id, p.name)}
                        >
                          Remove
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!products.loading && !products.error && totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-3">
              <Button
                variant="quiet"
                className="min-h-[36px] px-4 text-xs"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                ← Previous
              </Button>
              <span className="text-xs text-neutral-700">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="quiet"
                className="min-h-[36px] px-4 text-xs"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next →
              </Button>
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="mb-3 text-lg">Categories</h2>
          <p className="mb-3 text-xs text-neutral-700">
            Sellers create their own listings — admins manage the category tree they publish into.
          </p>
          {categories.loading ? (
            <p className="text-sm text-neutral-700">Loading…</p>
          ) : categories.error ? (
            <p className="text-sm text-neutral-700">Categories could not be loaded.</p>
          ) : categoryItems.length === 0 ? (
            <EmptyState title="No categories yet" />
          ) : (
            <div className="mb-4 flex flex-col gap-2">
              {categoryItems.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-2xl bg-neutral-100 px-3 py-2 text-sm">
                  <div>
                    <div className="font-bold">{c.name}</div>
                    <div className="text-xs text-neutral-700">{c.productCount} products</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(c.id, c.name)}
                    className="cursor-pointer border-0 bg-transparent text-xs font-bold text-accent-700 hover:text-accent-800"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleCreateCategory} className="flex gap-2">
            <TextField
              label="New category"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="e.g. Havan samagri"
              className="flex-1"
            />
            <Button
              type="submit"
              variant="quiet"
              className="mt-[22px] min-h-[44px] px-4 text-sm"
              disabled={creatingCategory || !newCategory.trim()}
            >
              Add
            </Button>
          </form>
        </Card>
      </div>
    </AdminLayout>
  );
}
