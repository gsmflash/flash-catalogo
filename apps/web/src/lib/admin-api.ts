import { API_URL } from "@/lib/api";

const TOKEN_KEY = "flashcell_admin_token";
const USER_KEY = "flashcell_admin_user";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "editor";
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AdminUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as AdminUser) : null;
}

export function storeSession(token: string, user: AdminUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
  }
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
}

export async function adminFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = getStoredToken();
  const isFormData = options.body instanceof FormData;

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    body: isFormData ? (options.body as FormData) : options.body ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 401) {
    clearSession();
    if (typeof window !== "undefined") window.location.href = "/admin/login";
    throw new ApiError(401, "Sessão expirada");
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: "Erro desconhecido" }));
    throw new ApiError(res.status, data.error ?? "Erro desconhecido", data.details);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
