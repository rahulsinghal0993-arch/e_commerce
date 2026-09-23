import type { OrderStatus } from '@arghya/api-client';

// Order-status label/color now lives in @arghya/utils, shared with every
// app that displays an order status. Only the admin-specific allowed
// transitions stay here.
export { orderStatusMeta, ORDER_STATUS_META } from '@arghya/utils';

// Mirrors STATUS_TRANSITIONS in server/src/services/order.service.js — keep
// the two in sync.
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['shipped', 'cancelled'],
  paid: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};
