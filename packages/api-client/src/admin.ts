import type { RequestFn } from './client.js';
import type {
  Category,
  ContactMessage,
  HeroSlide,
  Ledger,
  ListResponse,
  Order,
  OrderStatus,
  PaginatedListResponse,
  Product,
  Review,
  SellerApplication,
} from './types.js';

export interface SellerSummary {
  id: string;
  storeId: string;
  storeName: string;
  email?: string;
  fullName?: string;
}

export function createAdminApi({ request }: { request: RequestFn }) {
  return {
    // ---- Seller applications ----
    adminApplications: (status?: string): Promise<ListResponse<SellerApplication>> => {
      const qs = status ? `?status=${encodeURIComponent(status)}` : '';
      return request(`/admin/seller-applications${qs}`, { auth: true });
    },
    reviewApplication: (id: string, action: 'approve' | 'reject'): Promise<SellerApplication> =>
      request(`/admin/seller-applications/${id}`, { method: 'PATCH', body: { action }, auth: true }),

    // ---- Sellers ----
    adminSellers: (): Promise<ListResponse<SellerSummary>> => request('/admin/sellers', { auth: true }),
    revokeSeller: (id: string): Promise<void> => request(`/admin/sellers/${id}`, { method: 'DELETE', auth: true }),

    // ---- Orders ----
    adminOrders: (): Promise<ListResponse<Order>> => request('/admin/orders', { auth: true }),
    adminOrder: (id: string): Promise<Order> => request(`/admin/orders/${id}`, { auth: true }),
    adminUpdateOrderStatus: (id: string, status: OrderStatus): Promise<Order> =>
      request(`/admin/orders/${id}/status`, { method: 'PATCH', body: { status }, auth: true }),

    // ---- Categories ----
    adminCategories: (): Promise<Category[]> => request('/admin/categories', { auth: true }),
    createCategory: (name: string): Promise<Category> =>
      request('/admin/categories', { method: 'POST', body: { name }, auth: true }),
    deleteCategory: (id: string): Promise<void> => request(`/admin/categories/${id}`, { method: 'DELETE', auth: true }),

    // ---- Products ----
    adminDeleteProduct: (id: string): Promise<void> => request(`/admin/products/${id}`, { method: 'DELETE', auth: true }),
    adminProducts: (
      approvalStatus?: string,
      { page = 1, limit = 100 }: { page?: number; limit?: number } = {}
    ): Promise<PaginatedListResponse<Product>> => {
      const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (approvalStatus) qs.set('approval_status', approvalStatus);
      return request(`/admin/products?${qs}`, { auth: true });
    },
    adminSetProductApproval: (id: string, action: 'approve' | 'reject', reason?: string): Promise<Product> =>
      request(`/admin/products/${id}/approval`, {
        method: 'PATCH',
        body: reason ? { action, reason } : { action },
        auth: true,
      }),

    // ---- Finance ----
    adminLedger: (): Promise<Ledger> => request('/admin/ledger', { auth: true }),
    adminCreateSettlement: (storeId: string, orderIds: string[], note?: string): Promise<{ id: string }> =>
      request('/admin/settlements', {
        method: 'POST',
        body: { store_id: storeId, order_ids: orderIds, ...(note ? { note } : {}) },
        auth: true,
      }),

    // ---- Reviews (moderation) ----
    adminReviews: (): Promise<ListResponse<Review>> => request('/admin/reviews', { auth: true }),
    adminSetReviewHidden: (id: string, isHidden: boolean): Promise<Review> =>
      request(`/admin/reviews/${id}`, { method: 'PATCH', body: { is_hidden: isHidden }, auth: true }),
    adminDeleteReview: (id: string): Promise<void> => request(`/admin/reviews/${id}`, { method: 'DELETE', auth: true }),

    // ---- Homepage hero slides ----
    adminHeroSlides: (): Promise<HeroSlide[]> => request('/admin/hero-slides', { auth: true }),
    createHeroSlide: (data: Partial<HeroSlide>): Promise<HeroSlide> =>
      request('/admin/hero-slides', { method: 'POST', body: data, auth: true }),
    updateHeroSlide: (id: string, data: Partial<HeroSlide>): Promise<HeroSlide> =>
      request(`/admin/hero-slides/${id}`, { method: 'PATCH', body: data, auth: true }),
    deleteHeroSlide: (id: string): Promise<void> => request(`/admin/hero-slides/${id}`, { method: 'DELETE', auth: true }),
    uploadHeroSlideImage: (file: File): Promise<{ url: string }> => {
      const form = new FormData();
      form.append('image', file);
      return request('/admin/hero-slides/image', {
        method: 'POST',
        body: form,
        auth: true,
        formData: true,
      });
    },

    // ---- Contact inbox ----
    adminContactMessages: (): Promise<ListResponse<ContactMessage>> => request('/admin/contact-messages', { auth: true }),
    adminUpdateContactMessage: (id: string, isRead: boolean): Promise<ContactMessage> =>
      request(`/admin/contact-messages/${id}`, { method: 'PATCH', body: { is_read: isRead }, auth: true }),
    adminReplyContactMessage: (id: string, reply: string): Promise<ContactMessage> =>
      request(`/admin/contact-messages/${id}/reply`, { method: 'POST', body: { reply }, auth: true }),
    adminDeleteContactMessage: (id: string): Promise<void> =>
      request(`/admin/contact-messages/${id}`, { method: 'DELETE', auth: true }),
  };
}
