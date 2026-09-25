import {
  createApiClient,
  createAuthApi,
  createSellerApi,
  createContactApi,
  createCatalogApi,
} from '@arghya/api-client';
import type { ListResponse, Order, OrderItem, Product, SellerApplicationStatus } from '@arghya/api-client';

const BASE_URL = import.meta.env?.VITE_API_URL || '/api';

const client = createApiClient({ baseUrl: BASE_URL });

// server/src/services/order.service.js's attachItems() puts unitPrice on every
// line item the seller endpoints return, but @arghya/api-client's shared
// `OrderItem` type omits it (only sellers need per-unit price, not customers).
export interface SellerOrderItem extends OrderItem {
  unitPrice: number;
}

export interface SellerOrder extends Order {
  items: SellerOrderItem[];
}

// /seller/products attaches each product's raw image rows (server/src/services
// /product.service.js), not the flattened cover-image `string[]` the shared
// `Product` type declares for the customer-facing catalog shape.
export interface SellerProductImage {
  id: string;
  url: string;
  isCover: boolean;
}

export interface SellerProduct extends Omit<Product, 'images'> {
  images: SellerProductImage[];
}

// /seller-applications and /seller-applications/me answer with the raw
// snake_case DB row (server/src/services/seller.service.js), not the camelCase
// `SellerApplication` shape declared in @arghya/api-client.
export interface SellerApplicationRaw {
  id: string;
  store_name: string;
  contact_email: string;
  status: SellerApplicationStatus;
  created_at: string;
  reviewed_at?: string | null;
}

export const api = {
  ...createAuthApi(client),
  ...createSellerApi(client),
  ...createContactApi(client),
  categories: createCatalogApi(client).categories,
  sellerOrders: (): Promise<ListResponse<SellerOrder>> => client.request('/seller/orders', { auth: true }),
  sellerProducts: (): Promise<ListResponse<SellerProduct>> => client.request('/seller/products', { auth: true }),
  mySellerApplications: (): Promise<ListResponse<SellerApplicationRaw>> =>
    client.request('/seller-applications/me', { auth: true }),
  createSellerApplication: (data: { store_name: string; contact_email: string }): Promise<SellerApplicationRaw> =>
    client.request('/seller-applications', { method: 'POST', body: data, auth: true }),
};

export { ApiError } from '@arghya/api-client';
