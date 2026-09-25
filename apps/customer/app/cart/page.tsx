'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { ProductCard as ProductCardData } from '@arghya/api-client';
import { Button } from '@arghya/ui';
import { inr, toProductCardList } from '@arghya/utils';
import { useCartStore } from '../../store/cartStore.js';
import { api } from '../../lib/api.js';
import { MinimalHeader } from '../../components/MinimalHeader.js';
import { MobileTabBar } from '../../components/MobileTabBar.js';
import { ProductCard } from '../../components/ProductCard.js';

function EmptyCartSuggestions() {
  const [suggestions, setSuggestions] = useState<ProductCardData[]>([]);

  useEffect(() => {
    let active = true;
    api
      .products({ limit: 3 })
      .then((res) => {
        if (active) setSuggestions(toProductCardList(res?.items));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  if (suggestions.length === 0) return null;

  return (
    <div className="px-4 md:px-11 pb-10">
      <div className="text-[11px] tracking-wide uppercase text-neutral-700 mb-3">Buy again</div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-[720px]">
        {suggestions.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQty = useCartStore((s) => s.updateQty);
  const getSubtotal = useCartStore((s) => s.getSubtotal);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => setHydrated(true), []);

  if (!hydrated) {
    return (
      <div className="min-h-screen flex flex-col">
        <MinimalHeader title="Your cart" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <MinimalHeader title="Your cart" />
        <div className="flex-1 grid md:grid-cols-2 items-center gap-8 px-4 md:px-11 py-12 max-w-[1100px] mx-auto w-full">
          <div className="text-center md:text-left">
            <div className="dev text-5xl text-accent-300 leading-none mb-3">अर्घ्य</div>
            <h1 className="text-3xl mb-2.5">Nothing in the thali yet</h1>
            <p className="text-[15px] text-neutral-700 mb-6 max-w-[44ch] mx-auto md:mx-0 leading-relaxed">
              Start with a puja kit, or browse samagri by category.
            </p>
            <div className="flex gap-3 justify-center md:justify-start flex-wrap">
              <Button as={Link} href="/category/all">
                Browse all samagri
              </Button>
            </div>
          </div>
        </div>
        <EmptyCartSuggestions />
        <MobileTabBar />
      </div>
    );
  }

  const subtotal = getSubtotal();

  return (
    <div className="min-h-screen flex flex-col">
      <MinimalHeader title="Your cart" step={`${items.length} item${items.length === 1 ? '' : 's'}`} />
      <div className="flex-1 px-4 md:px-11 py-6 grid md:grid-cols-[1fr_360px] gap-8 max-w-[1180px] mx-auto w-full">
        <div>
          <div className="flex items-baseline justify-between mb-4">
            <h1 className="text-2xl m-0">
              {items.length} item{items.length === 1 ? '' : 's'}
            </h1>
            <Link href="/category/all" className="text-[13px] font-bold">
              Continue shopping →
            </Link>
          </div>

          <div className="flex flex-col gap-3.5">
            {items.map(({ product, quantity }) => (
              <div key={product.id} className="flex gap-4 items-center p-4 rounded-3xl bg-surface">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={product.img} alt={product.title} className="w-20 h-20 rounded-2xl object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <Link href={`/product/${product.id}`} className="font-heading text-[16px] text-inherit no-underline">
                    {product.title}
                  </Link>
                  {product.storeName && <div className="text-xs text-neutral-700 mt-0.5">Sold by {product.storeName}</div>}
                </div>
                <div className="flex items-center gap-1.5 min-h-11 px-2 rounded-full border border-divider shrink-0">
                  <button
                    type="button"
                    aria-label={`Decrease quantity of ${product.title}`}
                    onClick={() => updateQty(product.id, quantity - 1)}
                    className="w-7 h-7 rounded-full border-0 bg-transparent text-[16px] cursor-pointer"
                  >
                    −
                  </button>
                  <span className="font-bold min-w-[16px] text-center text-sm">{quantity}</span>
                  <button
                    type="button"
                    aria-label={`Increase quantity of ${product.title}`}
                    onClick={() => updateQty(product.id, quantity + 1)}
                    className="w-7 h-7 rounded-full border-0 bg-transparent text-[16px] cursor-pointer"
                  >
                    +
                  </button>
                </div>
                <div className="w-24 text-right shrink-0">
                  <div className="font-bold text-[15px]">{inr(product.price * quantity)}</div>
                  <button
                    type="button"
                    onClick={() => removeItem(product.id)}
                    className="border-0 bg-transparent text-accent-700 text-xs font-bold cursor-pointer p-0 mt-1.5"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="p-6 rounded-3xl bg-surface border border-divider h-max">
          <h2 className="text-xl m-0 mb-4">Order summary</h2>
          <div className="text-sm border-t border-divider pt-3.5">
            <div className="flex justify-between mb-2">
              <span className="text-neutral-700">Subtotal</span>
              <span>{inr(subtotal)}</span>
            </div>
            <div className="flex justify-between pt-3 border-t border-divider font-heading text-[22px] mt-2">
              <span>Total</span>
              <span>{inr(subtotal)}</span>
            </div>
          </div>
          <Button as={Link} href="/checkout" className="w-full mt-4 box-border">
            Proceed to checkout
          </Button>
        </aside>
      </div>
      <MobileTabBar />
    </div>
  );
}
