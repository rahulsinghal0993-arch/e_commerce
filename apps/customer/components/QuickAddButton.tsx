'use client';

import type { ProductCard } from '@arghya/api-client';
import { useToastStore } from '@arghya/ui';
import { useCartStore } from '../store/cartStore.js';

export function QuickAddButton({ product, className = '' }: { product: ProductCard; className?: string }) {
  const addItem = useCartStore((s) => s.addItem);
  const addToast = useToastStore((s) => s.addToast);
  const soldOut = product.stock === 0;

  if (soldOut) {
    return (
      <button
        type="button"
        disabled
        className={`btn-ghost min-h-[38px] w-full rounded-full border border-divider text-neutral-600 text-[13px] font-bold cursor-not-allowed ${className}`}
      >
        Sold out
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        addItem(product);
        addToast(`Added ${product.title} to cart`, 'success');
      }}
      className={`min-h-[38px] w-full rounded-full border border-accent text-accent-700 text-[13px] font-bold cursor-pointer bg-transparent hover:bg-accent-100 transition-colors ${className}`}
    >
      Add to cart
    </button>
  );
}
