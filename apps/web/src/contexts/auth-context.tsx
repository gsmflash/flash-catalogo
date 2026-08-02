"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { adminFetch, clearSession, getStoredToken, getStoredUser, storeSession, type AdminUser } from "@/lib/admin-api";

interface AuthContextValue {
  user: AdminUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getStoredToken();
    const storedUser = getStoredUser();
    if (!token || !storedUser) {
      setLoading(false);
      return;
    }

    setUser(storedUser);
    adminFetch<AdminUser>("/auth/me")
      .then((freshUser) => setUser(freshUser))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const data = await adminFetch<{ token: string; user: AdminUser }>("/auth/login", {
      method: "POST",
      body: { email, password },
    });
    storeSession(data.token, data.user);
    setUser(data.user);
  }

  function logout() {
    clearSession();
    setUser(null);
    window.location.href = "/admin/login";
  }

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
