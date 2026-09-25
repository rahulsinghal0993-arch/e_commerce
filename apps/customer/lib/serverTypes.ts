// @arghya/api-client's User/Order/OrderItem/PaymentOrder/HeroSlide/Review
// types describe an idealized camelCase contract. Several endpoints this app
// calls verifiably reply with a different shape (checked directly against
// server/src/services/*.js and server/src/middleware/auth.js). Since
// packages/api-client is out of scope for this app, these types capture what
// the server actually sends so the real field names used below type-check
// without inventing behavior — they are a stopgap until the shared package
// contract is corrected upstream.
import type { OrderStatus, Product, User } from '@arghya/api-client';

export interface CustomerShippingAddress {
  firstName?: string;
  lastName?: string;
  address?: string;
  city?: string;
  pin?: string;
  phone?: string;
}

// GET /auth/me, login, register, updateProfile all include shipping_address
// -> shippingAddress (server/src/middleware/auth.js:63, controllers/auth.controller.js:23).
export interface CustomerUser extends User {
  shippingAddress?: CustomerShippingAddress | null;
}

// order_items rows as attached by order.service.js#attachItems — camelCase,
// but with fields (unitPrice, discountPercent, coverImage) the shared
// OrderItem type doesn't declare.
export interface CustomerOrderItem {
  id: string;
  productId: string | null;
  productName: string;
  unitPrice: number;
  discountPercent: number;
  quantity: number;
  lineTotal: number;
  coverImage: string | null;
}

// GET /orders and GET /orders/:id (order.service.js#listOrders / #getOrder)
// return the raw order row: snake_case shipping_address/created_at, never
// remapped to camelCase the way getOrderForAdmin() does.
export interface CustomerOrder {
  id: string;
  status: OrderStatus;
  subtotal: number;
  total: number;
  shipping_address: CustomerShippingAddress | null;
  created_at: string;
  items: CustomerOrderItem[];
}

export interface CustomerOrderList {
  items: CustomerOrder[];
}

export interface CheckoutOrderSplit {
  orderId: string;
  storeId: string | null;
  total: number;
}

// POST /payments/order's actual reply (payment.service.js#createPaymentOrder)
// — one gateway order covering every per-seller order a split cart produced.
export interface PaymentCheckout {
  keyId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  orderIds: string[];
  orders: CheckoutOrderSplit[];
  total: number;
}

// POST /orders sends { product_id, quantity } (server/src/validators/order.validators.js),
// not the api-client OrderItemInput type's camelCase productId.
export interface CheckoutItemPayload {
  product_id: string;
  quantity: number;
}

// review.service.js#serializeReview's actual fields — `author` + `userId`,
// not the shared Review type's `authorName`.
export interface CustomerReview {
  id: string;
  productId: string;
  userId: string;
  author: string;
  rating: number;
  comment: string | null;
  isHidden: boolean;
  sellerReply: string | null;
  sellerRepliedAt: string | null;
  createdAt: string;
}

export interface ProductReviewList {
  items: CustomerReview[];
  average: number;
  count: number;
}

// GET /products/:id/reviews/eligibility replies { canReview }, not { eligible }
// (review.controller.js#getReviewEligibility).
export interface ReviewEligibility {
  canReview: boolean;
}

// GET /hero-slides replies { items: [...] } (hero.controller.js#listSlides),
// and each slide keeps its own field names (hero.service.js#serializeSlide)
// rather than the shared HeroSlide type's title/subtitle/ctaLabel/ctaHref.
export interface StorefrontHeroSlide {
  id: string;
  eyebrow: string | null;
  title: string;
  description: string | null;
  imageUrl: string;
  buttonLabel: string | null;
  buttonLink: string | null;
}

export interface HeroSlideList {
  items: StorefrontHeroSlide[];
}

// GET /products replies { items, page, limit, total } (catalog.service.js#listProducts);
// the shared ListResponse<T> only declares `items`.
export interface ProductListResult {
  items: Product[];
  page: number;
  limit: number;
  total: number;
}

// GET /products/:id's `images` are objects ({ id, url }), not the shared
// Product type's `images?: string[]`.
export interface ProductImage {
  id: string;
  url: string;
}

export interface CustomerProduct extends Omit<Product, 'images'> {
  images?: ProductImage[];
}
