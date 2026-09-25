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

function mergeCartItems(base: CartItem[], incoming: CartItem[]): CartItem[] {
  const merged = base.map((item) => ({ ...item }));
  for (const item of incoming) {
    const existing = merged.find((i) => i.product.id === item.product.id);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      merged.push(item);
    }
  }
  return merged;
}

// Swaps the persisted cart to the given owner (null = signed-out guest) and
// loads that owner's saved items. When the swap is a guest signing into an
// account, the guest cart they were just building is folded into the
// account's saved cart (not discarded) and the guest key is cleared so it
// isn't merged in again — and inflated — on a future sign-in. Any other
// transition (switching accounts, signing out) just loads that owner's own
// saved cart, matching the original behavior.
export function setCartOwner(userId?: string | null): void {
  const previousKey = useCartStore.persist.getOptions().name;
  const key = cartStorageKey(userId);
  if (previousKey === key) return;

  const isGuestToUser = previousKey === GUEST_CART_KEY && Boolean(userId);
  // Read the guest cart straight from storage rather than the live store
  // state — zustand's persist rehydration is async, so `getState()` could
  // still reflect the pre-hydration empty default at this point.
  const guestItems = isGuestToUser ? (readPersistedItems(GUEST_CART_KEY) ?? []) : [];
  const saved = readPersistedItems(key) ?? [];

  useCartStore.persist.setOptions({ name: key });
  useCartStore.setState({ items: isGuestToUser ? mergeCartItems(saved, guestItems) : saved });

  if (isGuestToUser && guestItems.length > 0) {
    try {
      localStorage.removeItem(GUEST_CART_KEY);
    } catch {
      // Storage can be unavailable (e.g. private mode); nothing to clean up.
    }
  }
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
