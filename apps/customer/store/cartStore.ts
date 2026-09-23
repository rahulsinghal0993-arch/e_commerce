'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProductCard } from '@arghya/api-client';

export interface CartItem {
  product: ProductCard;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (product: ProductCard) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getSubtotal: () => number;
}

// One cart per browser by default; when a user signs in the cart is namespaced
// under their id so two accounts on the same browser never share a cart.
const GUEST_CART_KEY = 'arghya-cart';

export const cartStorageKey = (userId?: string | null): string =>
  userId ? `${GUEST_CART_KEY}:${userId}` : GUEST_CART_KEY;

function readPersistedItems(key: string): CartItem[] | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const parsed = JSON.parse(localStorage.getItem(key) ?? 'null');
    const items = parsed?.state?.items;
    return Array.isArray(items) ? items : null;
  } catch {
    return null;
  }
}

// Swaps the persisted cart to the given owner (null = signed-out guest) and
// loads that owner's saved items, leaving every other owner's cart untouched.
export function setCartOwner(userId?: string | null): void {
  const key = cartStorageKey(userId);
  if (useCartStore.persist.getOptions().name === key) return;
  const saved = readPersistedItems(key);
  useCartStore.persist.setOptions({ name: key });
  useCartStore.setState({ items: saved ?? [] });
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product) => {
        const existing = get().items.find((i) => i.product.id === product.id);
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
            ),
          });
        } else {
          set({ items: [...get().items, { product, quantity: 1 }] });
        }
      },

      removeItem: (productId) => {
        set({ items: get().items.filter((i) => i.product.id !== productId) });
      },

      updateQty: (productId, qty) => {
        if (qty < 1) {
          set({ items: get().items.filter((i) => i.product.id !== productId) });
        } else {
          set({
            items: get().items.map((i) => (i.product.id === productId ? { ...i, quantity: qty } : i)),
          });
        }
      },

      clearCart: () => set({ items: [] }),

      getTotalItems: () => get().items.reduce((acc, i) => acc + i.quantity, 0),

      getSubtotal: () => get().items.reduce((acc, i) => acc + i.product.price * i.quantity, 0),
    }),
    { name: GUEST_CART_KEY }
  )
);
