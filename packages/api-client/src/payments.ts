import type { RequestFn } from './client.js';
import type { PaymentOrder, ShippingAddress, VerifyPaymentPayload } from './types.js';
import type { OrderItemInput } from './orders.js';

export function createPaymentsApi({ request }: { request: RequestFn }) {
  return {
    // Opens a gateway order for the server-priced cart. Returns the public
    // keyId plus the gateway order id the Razorpay modal needs.
    createPaymentOrder: (items: OrderItemInput[], shippingAddress: ShippingAddress): Promise<PaymentOrder> =>
      request('/payments/order', {
        method: 'POST',
        body: { items, shipping_address: shippingAddress },
        auth: true,
      }),
    // Called from the modal's success handler with the gateway's signature.
    // The server verifies it, then flips the orders to paid.
    verifyPayment: (payload: VerifyPaymentPayload): Promise<{ ok: boolean }> =>
      request('/payments/verify', {
        method: 'POST',
        body: payload,
        auth: true,
      }),
  };
}
