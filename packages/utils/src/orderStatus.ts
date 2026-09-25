import type { OrderStatus } from '@arghya/api-client';
import type { TagVariant } from '@arghya/ui';

// Order-status label/color, shared by every app that displays an order
// (admin, seller, customer) so the same status reads the same way no matter
// which console you're looking at it from.
export interface OrderStatusMeta {
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

export function orderStatusMeta(status: OrderStatus | null | undefined): OrderStatusMeta {
  if (!status) return { label: 'Unknown', variant: 'mute' };
  return ORDER_STATUS_META[status] ?? { label: status, variant: 'mute' };
}
