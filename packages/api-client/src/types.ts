// Shapes returned by the Arghya Express API, as actually produced by
// server/src/services/*.js — kept here (not per-app) so every client types
// against the same contract. These describe the JSON on the wire; camelCase
// throughout (the server maps snake_case DB columns to this shape).

export type UserRole = 'guest' | 'customer' | 'seller' | 'admin';

export interface User {
  id: string;
  email: string;
  role: Exclude<UserRole, 'guest'>;
  fullName: string;
  avatarUrl: string | null;
  phone?: string | null;
}

export interface Category {
  id: string;
  name: string;
  slug?: string;
}

export type ProductApprovalStatus = 'pending' | 'approved' | 'rejected';
export type ProductStatus = 'active' | 'draft' | 'out_of_stock';

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  salePrice: number;
  discount_percent: number;
  stock: number;
  status: ProductStatus;
  approvalStatus: ProductApprovalStatus;
  rejectionReason?: string | null;
  category: Category | null;
  storeId: string | null;
  storeName: string | null;
  coverImage: string | null;
  images?: string[];
}

export interface ProductCard {
  id: string;
  title: string;
  price: number;
  oldPrice: number | null;
  desc: string;
  img: string;
  badge: string | null;
  badgeColor: 'error' | 'secondary' | null;
  category: string;
  storeId: string | null;
  storeName: string | null;
  stock: number;
  status: ProductStatus;
}

export interface Review {
  id: string;
  rating: number;
  comment: string;
  isHidden?: boolean;
  sellerReply?: string | null;
  authorName?: string;
  productName?: string | null;
  createdAt: string;
}

export interface Store {
  id: string;
  name: string;
  description: string | null;
  is_official: boolean;
}

export type SellerApplicationStatus = 'pending' | 'approved' | 'rejected';

export interface SellerApplication {
  id: string;
  storeName: string;
  contactEmail?: string;
  status: SellerApplicationStatus;
  createdAt?: string;
}

export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItem {
  id: string;
  productId?: string;
  productName: string;
  quantity: number;
  lineTotal: number;
}

export interface ShippingAddress {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  [key: string]: string | undefined;
}

export interface Order {
  id: string;
  status: OrderStatus;
  subtotal: number;
  total: number;
  createdAt: string;
  shippingAddress: ShippingAddress | string | null;
  customerName?: string | null;
  customer?: { name: string | null; email?: string | null; phone?: string | null };
  store?: string | null;
  items?: OrderItem[];
}

export interface LedgerSellerRow {
  storeId: string;
  storeName: string;
  gross: number;
  platformFee: number;
  payout: number;
  settled: number;
  unsettled: number;
}

export interface LedgerSummary {
  grossSales: number;
  platformFees: number;
  sellerPayouts: number;
  unsettledPayouts: number;
  orders: number;
}

export interface Ledger {
  summary: LedgerSummary;
  sellers: LedgerSellerRow[];
}

export interface HeroSlide {
  id: string;
  title: string;
  subtitle?: string | null;
  imageUrl: string;
  ctaLabel?: string | null;
  ctaHref?: string | null;
}

export interface ContactMessage {
  id: string;
  name?: string;
  email?: string;
  message: string;
  isRead?: boolean;
  reply?: string | null;
  storeId?: string | null;
  storeName?: string | null;
  productName?: string | null;
  createdAt?: string;
}

// Most list endpoints answer `{ items: T[] }`.
export interface ListResponse<T> {
  items: T[];
}

export interface PaymentOrder {
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
}

export interface VerifyPaymentPayload {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}
