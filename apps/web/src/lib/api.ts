import type { Category, PaymentMachine, ProductDetail, ProductListResponse, StoreSettings } from "@/types";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
    next: { revalidate: 60, ...(init as { next?: { revalidate?: number } })?.next },
  });

  if (!res.ok) {
    if (res.status === 404) throw new NotFoundError(path);
    throw new Error(`Falha ao buscar ${path}: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export class NotFoundError extends Error {}

export interface ProductSearchParams {
  q?: string;
  category?: string;
  brand?: string;
  color?: string;
  storage?: string;
  page?: number;
  pageSize?: number;
}

export function getSettings(): Promise<StoreSettings> {
  return apiFetch<StoreSettings>("/settings");
}

export function getCategories(): Promise<Category[]> {
  return apiFetch<Category[]>("/categories");
}

export async function getPaymentMachines(): Promise<PaymentMachine[]> {
  const machines = await apiFetch<PaymentMachine[]>("/payments/machines");
  return machines.filter((m) => m.active);
}

export function getProducts(params: ProductSearchParams = {}): Promise<ProductListResponse> {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const qs = search.toString();
  return apiFetch<ProductListResponse>(`/products${qs ? `?${qs}` : ""}`);
}

export function getProductBySlug(slug: string): Promise<ProductDetail> {
  return apiFetch<ProductDetail>(`/products/${slug}`, { next: { revalidate: 30 } });
}
