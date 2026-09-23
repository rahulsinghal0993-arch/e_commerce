'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import { ApiError } from '@arghya/api-client';
import { useToastStore, TextField } from '@arghya/ui';
import { inr } from '@arghya/utils';
import { useCartStore } from '../../store/cartStore.js';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../lib/api.js';
import { MinimalHeader } from '../../components/MinimalHeader.js';
import type { CheckoutItemPayload, CustomerShippingAddress, PaymentCheckout } from '../../lib/serverTypes.js';

const RAZORPAY_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

interface RazorpayFailureResponse {
  error?: { description?: string };
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: { name: string; contact: string; email?: string };
  notes: Record<string, string>;
  theme: { color: string };
  handler: (response: unknown) => void;
  modal: { ondismiss: () => void };
}

interface RazorpayInstance {
  open: () => void;
  on: (event: 'payment.failed', cb: (response: RazorpayFailureResponse) => void) => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

function loadRazorpay(): Promise<NonNullable<Window['Razorpay']>> {
  if (typeof window === 'undefined') return Promise.reject(new Error('Payments unavailable.'));
  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  return new Promise((resolve, reject) => {
    const check = setInterval(() => {
      if (window.Razorpay) {
        clearInterval(check);
        resolve(window.Razorpay);
      }
    }, 100);
    setTimeout(() => {
      clearInterval(check);
      if (!window.Razorpay) reject(new Error('Could not start the payment gateway.'));
    }, 8000);
  });
}

export default function CheckoutPage() {
  const { items, getSubtotal, clearCart } = useCartStore();
  const addToast = useToastStore((s) => s.addToast);
  const { user, userRole, loading: authLoading } = useAuth();
  const router = useRouter();

  const [placing, setPlacing] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [form, setForm] = useState<Required<CustomerShippingAddress>>({
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    pin: '',
    phone: '',
  });
  const appliedDefault = useRef(false);

  useEffect(() => setHydrated(true), []);

  useEffect(() => {
    if (!authLoading && userRole !== 'customer') {
      router.replace('/sign-in?next=/checkout');
    }
  }, [authLoading, userRole, router]);

  useEffect(() => {
    const saved = user?.shippingAddress;
    if (appliedDefault.current || !saved) return;
    appliedDefault.current = true;
    setForm({
      firstName: saved.firstName ?? '',
      lastName: saved.lastName ?? '',
      address: saved.address ?? '',
      city: saved.city ?? '',
      pin: saved.pin ?? '',
      phone: saved.phone ?? '',
    });
  }, [user]);

  const subtotal = getSubtotal();

  const handlePlaceOrder = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (items.length === 0) {
      addToast('Your cart is empty.', 'error');
      return;
    }
    setPlacing(true);
    try {
      const payloadItems: CheckoutItemPayload[] = items.map(({ product, quantity }) => ({
        product_id: product.id,
        quantity,
      }));
      const shippingAddress = { ...form };

      let order: PaymentCheckout;
      try {
        const [, paymentOrder] = await Promise.all([
          loadRazorpay(),
          api.createPaymentOrder(payloadItems, shippingAddress) as unknown as Promise<PaymentCheckout>,
        ]);
        order = paymentOrder;
      } catch (err) {
        if (err instanceof ApiError && err.status === 503) {
          addToast('Payments are not set up on this environment yet.', 'error');
          setPlacing(false);
          return;
        }
        throw err;
      }

      const Razorpay = window.Razorpay;
      if (!Razorpay) throw new Error('Could not start the payment gateway.');

      await new Promise<void>((resolve, reject) => {
        const rzp = new Razorpay({
          key: order.keyId,
          amount: order.amount,
          currency: order.currency,
          name: 'Arghya',
          description: order.orders?.length > 1 ? `${order.orders.length} store orders` : 'Order payment',
          order_id: order.razorpayOrderId,
          prefill: {
            name: `${form.firstName} ${form.lastName}`.trim(),
            contact: form.phone,
            email: user?.email,
          },
          notes: { order_ids: (order.orderIds ?? []).join(',') },
          theme: { color: '#B7322A' },
          handler: async (response) => {
            try {
              await api.verifyPayment(
                response as { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }
              );
              clearCart();
              addToast('Payment successful — your puja is booked.', 'success');
              const [firstId, ...rest] = order.orderIds ?? [];
              const allParam = rest.length > 0 ? `&all=${(order.orderIds ?? []).join(',')}` : '';
              router.push(`/orders/${firstId}?placed=1${allParam}`);
              resolve();
            } catch (err) {
              reject(new Error(err instanceof ApiError ? err.message : 'We could not confirm your payment.'));
            }
          },
          modal: {
            ondismiss: () => reject(new Error('Payment cancelled. Your order is on hold — you can retry.')),
          },
        });
        rzp.on('payment.failed', (response) => {
          reject(new Error(response?.error?.description || 'Payment failed. Please try again.'));
        });
        rzp.open();
      });
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to place order.', 'error');
    } finally {
      setPlacing(false);
    }
  };

  if (!hydrated) {
    return (
      <div className="min-h-screen flex flex-col">
        <MinimalHeader title="Delivery & payment" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <MinimalHeader title="Delivery & payment" />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
          <h1 className="text-2xl">Your cart is empty</h1>
          <Link href="/category/all" className="btn min-h-[46px] rounded-full bg-accent text-bg font-heading px-6 inline-flex items-center no-underline">
            Browse all samagri
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Script src={RAZORPAY_SRC} strategy="afterInteractive" />
      <MinimalHeader title="Delivery & payment" step={<Link href="/cart" className="text-bg">← back to cart</Link>} />
      <div className="flex-1 px-4 md:px-11 py-6 grid md:grid-cols-[1fr_360px] gap-8 max-w-[1180px] mx-auto w-full">
        <form onSubmit={handlePlaceOrder} className="flex flex-col gap-4">
          <h1 className="text-2xl m-0 mb-1">Where should it reach?</h1>
          <div className="grid grid-cols-2 gap-3.5">
            <TextField
              label="First name"
              required
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            />
            <TextField
              label="Last name"
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            />
          </div>
          <TextField
            label="Address"
            required
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3.5">
            <TextField label="City" required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            <TextField label="PIN code" required value={form.pin} onChange={(e) => setForm({ ...form, pin: e.target.value })} />
          </div>
          <TextField
            label="Phone number"
            type="tel"
            required
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />

          <div className="p-4 rounded-2xl bg-surface border border-divider text-sm text-neutral-800 leading-relaxed mt-2">
            Clicking pay opens Razorpay&rsquo;s secure checkout. Your card details are entered there and never touch
            Arghya&rsquo;s servers.
          </div>

          <button
            type="submit"
            disabled={placing}
            className="btn min-h-[48px] rounded-full bg-accent text-bg font-heading text-[16px] cursor-pointer disabled:opacity-60 mt-2"
          >
            {placing ? 'Processing…' : `Pay ${inr(subtotal)}`}
          </button>
        </form>

        <aside className="p-6 rounded-3xl bg-surface border border-divider h-max">
          <h2 className="text-xl m-0 mb-4">Order summary</h2>
          <div className="flex flex-col gap-2.5 text-sm mb-4 max-h-[260px] overflow-y-auto">
            {items.map(({ product, quantity }) => (
              <div key={product.id} className="flex gap-3 items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={product.img} alt={product.title} className="w-11 h-11 rounded-xl object-cover shrink-0" />
                <span className="flex-1">
                  {product.title} ×{quantity}
                </span>
                <strong>{inr(product.price * quantity)}</strong>
              </div>
            ))}
          </div>
          <div className="text-sm border-t border-divider pt-3.5">
            <div className="flex justify-between pt-2 font-heading text-[22px]">
              <span>Payable</span>
              <span>{inr(subtotal)}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
