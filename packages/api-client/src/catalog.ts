import type { RequestFn } from './client.js';
import type { Category, HeroSlide, ListResponse, Product, Review } from './types.js';

export interface ProductQuery {
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
}

export function createCatalogApi({ request }: { request: RequestFn }) {
  return {
    categories: (): Promise<Category[]> => request('/categories'),
    heroSlides: (): Promise<HeroSlide[]> => request('/hero-slides'),
    products: ({ search, category, page = 1, limit = 100 }: ProductQuery = {}): Promise<ListResponse<Product>> => {
      const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search) qs.set('search', search);
      if (category) qs.set('category', category);
      return request(`/products?${qs}`);
    },
    product: (id: string): Promise<Product> => request(`/products/${id}`),
    productReviews: (id: string): Promise<ListResponse<Review>> => request(`/products/${id}/reviews`),
    reviewEligibility: (id: string): Promise<{ eligible: boolean; reason?: string }> =>
      request(`/products/${id}/reviews/eligibility`, { auth: true }),
    createProductReview: (id: string, { rating, comment }: { rating: number; comment: string }): Promise<Review> =>
      request(`/products/${id}/reviews`, { method: 'POST', body: { rating, comment }, auth: true }),
  };
}
