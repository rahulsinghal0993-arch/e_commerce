import type { OrderStatus } from '@arghya/api-client';
import type { TagVariant } from '@arghya/ui';

// Order lifecycle metadata shared by the orders list, order detail and
// dashboard screens. Mirrors STATUS_TRANSITIONS in
// server/src/services/order.service.js — keep the two in sync.

interface OrderStatusMeta {
  label: string;
  variant: TagVariant;
}

export const ORDER_STATUS_META: Record<OrderStatus, OrderStatusMeta> = {
  pending: { label: 'Awaiting payment', variant: 'mute' },
  paid: { label: 'Paid', variant: 'live' },
  shipped: { label: 'Shipped', variant: 'live' },
  delivered: { label: 'Delivered', variant: 'live' },
  cancelled: { label: 'Cancelled', variant: 'mute' },
};

export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['shipped', 'cancelled'],
  paid: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

export function orderStatusMeta(status: OrderStatus | null | undefined): OrderStatusMeta {
  if (!status) return { label: 'Unknown', variant: 'mute' };
  return ORDER_STATUS_META[status] ?? { label: status, variant: 'mute' };
}
