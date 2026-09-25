'use client';

import { useEffect, useState } from 'react';
import { Stars, useToastStore } from '@arghya/ui';
import { ApiError } from '@arghya/api-client';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../lib/api.js';
import type { CustomerReview, ReviewEligibility } from '../lib/serverTypes.js';

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function ReviewsSection({
  productId,
  initialReviews,
  initialAverage,
  initialCount,
}: {
  productId: string;
  initialReviews: CustomerReview[];
  initialAverage: number;
  initialCount: number;
}) {
  const { userRole } = useAuth();
  const addToast = useToastStore((s) => s.addToast);
  const [reviews, setReviews] = useState<CustomerReview[]>(initialReviews);
  const [average, setAverage] = useState(initialAverage);
  const [count, setCount] = useState(initialCount);
  const [eligible, setEligible] = useState(false);
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (userRole !== 'customer') {
      setEligible(false);
      return;
    }
    let active = true;
    setCheckingEligibility(true);
    api
      .reviewEligibility(productId)
      .then((res) => {
        const { canReview } = res as unknown as ReviewEligibility;
        if (active) setEligible(Boolean(canReview));
      })
      .catch(() => {
        if (active) setEligible(false);
      })
      .finally(() => {
        if (active) setCheckingEligibility(false);
      });
    return () => {
      active = false;
    };
  }, [productId, userRole]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const saved = (await api.createProductReview(productId, { rating, comment })) as unknown as CustomerReview;
      const previousMine = reviews.find((r) => r.userId === saved.userId);
      setReviews((prev) => {
        const withoutMine = prev.filter((r) => r.userId !== saved.userId);
        return [saved, ...withoutMine];
      });
      // `average`/`count` reflect every review on the product, not just the
      // (possibly partial) page in `reviews` — recompute from the totals
      // rather than the local list, which the count already comes from.
      if (previousMine) {
        setAverage((avg) => (count > 0 ? (avg * count - previousMine.rating + saved.rating) / count : saved.rating));
      } else {
        setCount((c) => c + 1);
        setAverage((avg) => (avg * count + saved.rating) / (count + 1));
      }
      addToast('Thanks — your review is posted.', 'success');
      setComment('');
    } catch (err) {
      addToast(err instanceof ApiError ? err.message : 'Could not post your review.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="border-t border-divider pt-6 mt-6">
      <div className="flex items-baseline gap-3 mb-4">
        <h2 className="text-lg m-0">Reviews</h2>
        {count > 0 ? (
          <span className="text-sm text-neutral-700">
            <Stars value={average} /> {average.toFixed(1)} · {count} review{count === 1 ? '' : 's'}
          </span>
        ) : (
          <span className="text-sm text-neutral-700">No reviews yet</span>
        )}
      </div>

      {userRole === 'customer' && !checkingEligibility && eligible && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 rounded-2xl bg-surface flex flex-col gap-3 max-w-lg">
          <div className="text-sm font-bold">Write a review</div>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                aria-label={`${n} star${n === 1 ? '' : 's'}`}
                className={`text-2xl leading-none bg-transparent border-0 cursor-pointer ${
                  n <= rating ? 'text-accent-2-600' : 'text-neutral-400'
                }`}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="How was it for your puja?"
            rows={3}
            className="w-full rounded-2xl border border-divider bg-bg px-4 py-3 text-sm outline-none focus:border-accent resize-none"
          />
          <button
            type="submit"
            disabled={submitting}
            className="btn self-start min-h-[40px] rounded-full bg-accent text-bg font-heading px-5 cursor-pointer disabled:opacity-60"
          >
            {submitting ? 'Posting…' : 'Post review'}
          </button>
        </form>
      )}

      {reviews.length === 0 ? (
        <p className="text-sm text-neutral-700">Be the first to review this product once your order is delivered.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {reviews.map((r) => (
            <div key={r.id} className="border-b border-divider pb-4 last:border-b-0">
              <div className="flex items-center gap-2 mb-1">
                <Stars value={r.rating} />
                <strong className="text-sm">{r.author}</strong>
                <span className="text-xs text-neutral-700">{formatDate(r.createdAt)}</span>
              </div>
              {r.comment && <p className="text-sm text-neutral-800 m-0">{r.comment}</p>}
              {r.sellerReply && (
                <div className="mt-2 pl-3 border-l-2 border-accent-300 text-sm text-neutral-700">
                  <strong className="text-xs uppercase tracking-wide text-neutral-700">Seller reply</strong>
                  <p className="m-0 mt-0.5">{r.sellerReply}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
