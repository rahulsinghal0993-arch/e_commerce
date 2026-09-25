'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ProductCard } from '@arghya/api-client';
import { useToastStore } from '@arghya/ui';
import { useCartStore } from '../store/cartStore.js';

export function AddToCartButton({ product }: { product: ProductCard }) {
  const [qty, setQty] = useState(1);
  const items = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const updateQty = useCartStore((s) => s.updateQty);
  const addToast = useToastStore((s) => s.addToast);
  const router = useRouter();
  const soldOut = product.stock === 0;

  const handleAdd = () => {
    const existing = items.find((i) => i.product.id === product.id);
    if (existing) {
      updateQty(product.id, existing.quantity + qty);
    } else {
      addItem(product);
      if (qty > 1) updateQty(product.id, qty);
    }
    addToast(`Added ${qty > 1 ? `${qty} × ` : ''}${product.title} to cart`, 'success');
  };

  return (
    <div className="flex gap-3.5 items-center mb-3.5">
      <div className="flex items-center gap-1.5 min-h-12 px-2 rounded-full border border-divider">
        <button
          type="button"
          aria-label="Decrease quantity"
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          disabled={soldOut}
          className="w-8 h-8 rounded-full border-0 bg-transparent text-[17px] cursor-pointer disabled:opacity-40"
        >
          −
        </button>
        <span className="font-bold min-w-[18px] text-center">{qty}</span>
        <button
          type="button"
          aria-label="Increase quantity"
          onClick={() => setQty((q) => Math.min(99, q + 1))}
          disabled={soldOut}
          className="w-8 h-8 rounded-full border-0 bg-transparent text-[17px] cursor-pointer disabled:opacity-40"
        >
          +
        </button>
      </div>
      {soldOut ? (
        <button type="button" disabled className="btn flex-1 min-h-12 text-[16px] rounded-full opacity-50 cursor-not-allowed bg-neutral-400 text-bg font-heading">
          Sold out
        </button>
      ) : (
        <button
          type="button"
          onClick={handleAdd}
          className="btn flex-1 min-h-12 text-[16px] rounded-full bg-accent text-bg font-heading cursor-pointer hover:bg-accent-700 transition-colors"
        >
          Add to cart
        </button>
      )}
      <button
        type="button"
        onClick={() => {
          handleAdd();
          router.push('/checkout');
        }}
        disabled={soldOut}
        className="btn-ghost min-h-12 rounded-full border border-accent text-accent-700 font-heading px-5 cursor-pointer hover:bg-accent-100 disabled:opacity-40 transition-colors"
      >
        Buy now
      </button>
    </div>
  );
}
