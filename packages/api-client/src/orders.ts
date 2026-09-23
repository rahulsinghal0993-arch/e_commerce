import type { RequestFn } from './client.js';
import type { ListResponse, Order, ShippingAddress } from './types.js';

// Matches server/src/validators/order.validators.js exactly (snake_case on
// the wire, not this package's usual camelCase convention).
export interface OrderItemInput {
  product_id: string;
  quantity: number;
}

export function createOrdersApi({ request }: { request: RequestFn }) {
  return {
    createOrder: (items: OrderItemInput[], shippingAddress: ShippingAddress): Promise<ListResponse<Order>> =>
      request('/orders', {
        method: 'POST',
        body: { items, shipping_address: shippingAddress },
        auth: true,
      }),
    myOrders: (): Promise<ListResponse<Order>> => request('/orders', { auth: true }),
    order: (id: string): Promise<Order> => request(`/orders/${id}`, { auth: true }),
    cancelOrder: (id: string): Promise<Order> => request(`/orders/${id}/cancel`, { method: 'PATCH', auth: true }),
  };
}
