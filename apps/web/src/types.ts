import type { InstallmentOption, ProductStatus } from "@flashcell/shared";

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  key: string;
  sortOrder: number;
  isMain: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
}

export interface Product {
  id: string;
  slug: string;
  brand: string;
  model: string;
  color: string;
  storage: string;
  categoryId: string;
  price: string;
  pricePix: string;
  description: string;
  specifications: Record<string, string>;
  status: ProductStatus;
  machineId: string;
  images: ProductImage[];
  pricing: InstallmentOption[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductDetail extends Product {
  related: Product[];
}

/** Shape returned by the admin-only /products/admin listing (no computed pricing). */
export type AdminProduct = Omit<Product, "pricing">;

export interface ProductListResponse {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
}

export interface StoreSettings {
  id: string;
  storeName: string;
  logoUrl: string | null;
  bannerUrl: string | null;
  whatsapp: string;
  instagram: string | null;
  facebook: string | null;
  address: string | null;
  primaryColor: string;
}

export interface PaymentMachine {
  id: string;
  name: string;
  provider: string;
  fees: Array<{ id: string; method: "debito" | "credito"; installments: number; feePercent: string }>;
}
