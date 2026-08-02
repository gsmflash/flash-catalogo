"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { settingsSchema } from "@flashcell/shared";
import { adminFetch, ApiError } from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SingleImageUpload } from "@/components/admin/single-image-upload";
import type { StoreSettings } from "@/types";

export default function ConfiguracoesPage() {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminFetch<StoreSettings>("/settings").then(setSettings);
  }, []);

  function update<K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!settings) return;

    const parsed = settingsSchema.partial().safeParse(settings);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }

    setSaving(true);
    try {
      await adminFetch("/settings", { method: "PUT", body: parsed.data });
      toast.success("Configurações salvas");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  }

  if (!settings) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-2xl flex-col gap-6">
      <h1 className="text-2xl font-bold">Configurações</h1>

      <div className="flex gap-6">
        <div className="space-y-2">
          <Label>Logo</Label>
          <SingleImageUpload value={settings.logoUrl} onChange={(url) => update("logoUrl", url)} aspect="square" />
        </div>
        <div className="flex-1 space-y-2">
          <Label>Banner</Label>
          <SingleImageUpload value={settings.bannerUrl} onChange={(url) => update("bannerUrl", url)} aspect="wide" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="storeName">Nome da loja</Label>
        <Input id="storeName" value={settings.storeName} onChange={(e) => update("storeName", e.target.value)} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="whatsapp">WhatsApp (com DDI e DDD, só números)</Label>
        <Input
          id="whatsapp"
          placeholder="Ex: 5511999999999"
          value={settings.whatsapp}
          onChange={(e) => update("whatsapp", e.target.value.replace(/\D/g, ""))}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="instagram">Instagram (link completo)</Label>
        <Input
          id="instagram"
          placeholder="https://instagram.com/flashcell"
          value={settings.instagram ?? ""}
          onChange={(e) => update("instagram", e.target.value || null)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="facebook">Facebook (link completo)</Label>
        <Input
          id="facebook"
          placeholder="https://facebook.com/flashcell"
          value={settings.facebook ?? ""}
          onChange={(e) => update("facebook", e.target.value || null)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Endereço</Label>
        <Input id="address" value={settings.address ?? ""} onChange={(e) => update("address", e.target.value || null)} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="primaryColor">Cor principal</Label>
        <div className="flex items-center gap-3">
          <input
            id="primaryColor"
            type="color"
            value={settings.primaryColor}
            onChange={(e) => update("primaryColor", e.target.value)}
            className="size-10 cursor-pointer rounded border border-border"
          />
          <Input
            value={settings.primaryColor}
            onChange={(e) => update("primaryColor", e.target.value)}
            className="max-w-32"
          />
        </div>
      </div>

      <div>
        <Button type="submit" disabled={saving}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Salvar configurações
        </Button>
      </div>
    </form>
  );
}
