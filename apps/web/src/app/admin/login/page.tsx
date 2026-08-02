"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { ApiError } from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminLoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      router.push("/admin");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível entrar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-5 rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-ink-foreground shadow-premium-lg backdrop-blur"
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-gold">
            <ShieldCheck className="size-6" />
          </span>
          <div>
            <h1 className="text-xl font-semibold">Flash Cell Admin</h1>
            <p className="text-sm text-white/50">Entre para gerenciar o catálogo</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-white/70">
            E-mail
          </Label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            className="border-white/15 bg-white/5 text-white placeholder:text-white/30 focus-visible:ring-primary"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-white/70">
            Senha
          </Label>
          <Input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className="border-white/15 bg-white/5 text-white placeholder:text-white/30 focus-visible:ring-primary"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading && <Loader2 className="size-4 animate-spin" />}
          Entrar
        </Button>
      </form>
    </div>
  );
}
