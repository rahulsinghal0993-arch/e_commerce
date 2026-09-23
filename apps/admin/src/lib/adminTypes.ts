// The real Express endpoints these screens call return richer JSON than the
// shapes declared in @arghya/api-client (that package's admin.ts/types.ts
// were typed against the documented contract, not every field the admin
// console actually renders). These extend the shared types with the extra
// fields this app depends on, discovered by reading the working .jsx pages
// against the fields they access — see the report on the conversion task for
// the full list.
import type { Category, ListResponse, Review, SellerApplication } from '@arghya/api-client';
import type { SellerSummary } from '@arghya/api-client';

export interface CategoryRow extends Category {
  productCount: number;
}

export interface SellerApplicationRow extends SellerApplication {
  applicant?: string;
  reviewedAt?: string;
}

export interface SellerRow extends SellerSummary {
  store?: { name?: string | null; description?: string | null } | null;
  joinedAt?: string;
}

export interface ReviewRow extends Review {
  storeName?: string | null;
  author?: string;
}

export interface AdminLedgerSettlement {
  id: string;
  storeName: string;
  net: number;
  createdAt: string;
  orderCount: number;
  createdBy?: string | null;
  note?: string | null;
}

export interface AdminLedgerSellerRow {
  id: string;
  name: string;
  sellerName?: string | null;
  orderCount: number;
  gross: number;
  fee: number;
  unsettledPayout: number;
  unsettledOrders: { id: string }[];
}

export interface AdminLedgerSummary {
  grossSales: number;
  platformFees: number;
  sellerPayouts: number;
  settledPayouts: number;
  unsettledPayouts: number;
  orders: number;
}

export interface AdminLedgerResponse {
  summary: AdminLedgerSummary;
  sellers: AdminLedgerSellerRow[];
  settlements: AdminLedgerSettlement[];
  feeRate: number;
  asOf: string;
}

export type CategoryListResponse = ListResponse<CategoryRow>;
export type SellerApplicationListResponse = ListResponse<SellerApplicationRow>;
export type SellerListResponse = ListResponse<SellerRow>;
export type ReviewListResponse = ListResponse<ReviewRow>;
