import { useMemo, useState } from 'react';
import { Button, Card, EmptyState, Tag, TabGroup, useToastStore, type TabGroupOption } from '@arghya/ui';
import AdminLayout from '../components/AdminLayout.js';
import { api, ApiError } from '../lib/api.js';
import { useAsync } from '../lib/useAsync.js';
import { formatDate } from '../lib/format.js';
import type { ReviewListResponse } from '../lib/adminTypes.js';

type FilterKey = 'all' | 'visible' | 'hidden';

const FILTERS: TabGroupOption[] = [
  { key: 'all', label: 'All' },
  { key: 'visible', label: 'Visible' },
  { key: 'hidden', label: 'Hidden' },
];

export default function AdminModeration() {
  const addToast = useToastStore((s) => s.addToast);
  // adminReviews() is declared against the shared Review shape (authorName,
  // no storeName), but the real endpoint answers `author`/`storeName` too —
  // see lib/adminTypes.ts.
  const { data, loading, error, reload } = useAsync(
    () => api.adminReviews() as unknown as Promise<ReviewListResponse>,
    []
  );
  const [filter, setFilter] = useState<FilterKey>('all');
  const [busyId, setBusyId] = useState<string | null>(null);

  const items = data?.items ?? [];
  const filtered = useMemo(() => {
    if (filter === 'visible') return items.filter((r) => !r.isHidden);
    if (filter === 'hidden') return items.filter((r) => r.isHidden);
    return items;
  }, [items, filter]);

  async function handleToggleHidden(id: string, hide: boolean) {
    setBusyId(id);
    try {
      await api.adminSetReviewHidden(id, hide);
      addToast(hide ? 'Review hidden.' : 'Review restored.', 'success');
      reload();
    } catch (err) {
      addToast(err instanceof ApiError ? err.message : 'Could not update this review.', 'error');
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Permanently delete this review? This cannot be undone.')) return;
    setBusyId(id);
    try {
      await api.adminDeleteReview(id);
      addToast('Review deleted.', 'success');
      reload();
    } catch (err) {
      addToast(err instanceof ApiError ? err.message : 'Could not delete this review.', 'error');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AdminLayout>
      <div className="mb-6 flex flex-wrap items-end gap-3">
        <div>
          <h1 className="text-2xl">Listing moderation</h1>
          <div className="mt-0.5 text-xs text-neutral-700">
            {loading ? 'Loading…' : `${items.filter((r) => r.isHidden).length} hidden of ${items.length} reviews`}
          </div>
        </div>
        <TabGroup
          className="ml-auto"
          options={FILTERS}
          value={filter}
          onChange={(key) => setFilter(key as FilterKey)}
        />
      </div>

      <Card className="p-5">
        {loading ? (
          <p className="text-sm text-neutral-700">Loading reviews…</p>
        ) : error ? (
          <EmptyState
            title="Could not load reviews"
            description={error.message || 'The server did not respond. Try again shortly.'}
          />
        ) : filtered.length === 0 ? (
          <EmptyState title="Nothing here" description="No reviews match this filter." />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Store</th>
                <th>Rating</th>
                <th>Comment</th>
                <th>Author</th>
                <th>Posted</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td>{r.productName ?? '—'}</td>
                  <td>{r.storeName ?? '—'}</td>
                  <td>{'★'.repeat(r.rating)}</td>
                  <td className="max-w-xs truncate" title={r.comment}>
                    {r.comment || '—'}
                  </td>
                  <td>{r.author}</td>
                  <td>{formatDate(r.createdAt)}</td>
                  <td>
                    <Tag variant={r.isHidden ? 'mute' : 'live'}>
                      {r.isHidden ? 'Hidden' : 'Visible'}
                    </Tag>
                  </td>
                  <td className="whitespace-nowrap">
                    <div className="flex justify-end gap-1.5">
                      <Button
                        variant="quiet"
                        className="min-h-[32px] px-3 text-xs"
                        disabled={busyId === r.id}
                        onClick={() => handleToggleHidden(r.id, !r.isHidden)}
                      >
                        {r.isHidden ? 'Unhide' : 'Hide'}
                      </Button>
                      <Button
                        variant="ghost"
                        className="min-h-[32px] px-3 text-xs"
                        disabled={busyId === r.id}
                        onClick={() => handleDelete(r.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </AdminLayout>
  );
}
