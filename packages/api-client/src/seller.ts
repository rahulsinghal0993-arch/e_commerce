import type { RequestFn } from './client.js';
import type {
  ContactMessage,
  ListResponse,
  Order,
  OrderStatus,
  Product,
  ProductApprovalStatus,
  Review,
  SellerApplication,
  Store,
} from './types.js';

export function createSellerApi({ request }: { request: RequestFn }) {
  return {
    // ---- Products ----
    sellerProducts: (): Promise<ListResponse<Product>> => request('/seller/products', { auth: true }),
    createProduct: (data: Partial<Product> & Record<string, unknown>): Promise<Product> =>
      request('/products', { method: 'POST', body: data, auth: true }),
    updateProduct: (id: string, data: Partial<Product> & Record<string, unknown>): Promise<Product> =>
      request(`/products/${id}`, { method: 'PATCH', body: data, auth: true }),
    resubmitProduct: (id: string): Promise<Product> => request(`/products/${id}/resubmit`, { method: 'POST', auth: true }),
    deleteProduct: (id: string): Promise<void> => request(`/products/${id}`, { method: 'DELETE', auth: true }),
    uploadProductImages: (id: string, files: File[]): Promise<{ images: string[] }> => {
      const form = new FormData();
      files.forEach((file) => form.append('images', file));
      return request(`/products/${id}/images`, {
        method: 'POST',
        body: form,
        auth: true,
        formData: true,
      });
    },

    // ---- Applications ----
    createSellerApplication: (data: { storeName: string; contactEmail?: string } & Record<string, unknown>): Promise<SellerApplication> =>
      request('/seller-applications', { method: 'POST', body: data, auth: true }),
    mySellerApplications: (): Promise<ListResponse<SellerApplication>> => request('/seller-applications/me', { auth: true }),

    // ---- Store profile ----
    getSellerStore: (): Promise<Store> => request('/seller/store', { auth: true }),
    updateSellerStore: (patch: Partial<Store>): Promise<Store> =>
      request('/seller/store', { method: 'PATCH', body: patch, auth: true }),

    // ---- Orders ----
    sellerOrders: (): Promise<ListResponse<Order>> => request('/seller/orders', { auth: true }),
    updateSellerOrderStatus: (id: string, status: OrderStatus): Promise<Order> =>
      request(`/seller/orders/${id}/status`, { method: 'PATCH', body: { status }, auth: true }),

    // ---- Reviews ----
    sellerReviews: (): Promise<ListResponse<Review>> => request('/seller/reviews', { auth: true }),
    sellerReplyReview: (id: string, reply: string): Promise<Review> =>
      request(`/seller/reviews/${id}/reply`, { method: 'PATCH', body: { reply }, auth: true }),

    // ---- Contact inbox ----
    sellerContactMessages: (): Promise<ListResponse<ContactMessage>> => request('/seller/contact-messages', { auth: true }),
    updateSellerContactMessage: (id: string, isRead: boolean): Promise<ContactMessage> =>
      request(`/seller/contact-messages/${id}`, { method: 'PATCH', body: { is_read: isRead }, auth: true }),
    replyToSellerContactMessage: (id: string, reply: string): Promise<ContactMessage> =>
      request(`/seller/contact-messages/${id}/reply`, { method: 'POST', body: { reply }, auth: true }),
  };
}

export type { ProductApprovalStatus };
