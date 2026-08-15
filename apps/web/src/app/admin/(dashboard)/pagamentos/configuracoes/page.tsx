"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, CheckCircle2, Wifi, Save, CreditCard, QrCode } from "lucide-react";
import { MERCADOPAGO_MODES, PIX_KEY_TYPES, PIX_KEY_TYPE_LABELS } from "@flashcell/shared";
import type { MercadoPagoMode, PixKeyType } from "@flashcell/shared";
import { adminFetch, ApiError } from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SingleImageUpload } from "@/components/admin/single-image-upload";
import type { AdminPaymentSettings } from "@/types";

export default function PagamentosConfiguracoesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const [webhookUrl, setWebhookUrl] = useState<string | null>(null);
  const [accessTokenConfigured, setAccessTokenConfigured] = useState(false);
  const [webhookSecretConfigured, setWebhookSecretConfigured] = useState(false);

  const [mpAccessToken, setMpAccessToken] = useState("");
  const [mpPublicKey, setMpPublicKey] = useState("");
  const [mpWebhookSecret, setMpWebhookSecret] = useState("");
  const [mpMode, setMpMode] = useState<MercadoPagoMode>("sandbox");
  const [mpActive, setMpActive] = useState(false);

  const [pixName, setPixName] = useState("");
  const [pixBank, setPixBank] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [pixKeyType, setPixKeyType] = useState<PixKeyType>("aleatoria");
  const [pixQrCodeUrl, setPixQrCodeUrl] = useState<string | null>(null);

  function reload() {
    adminFetch<AdminPaymentSettings & { mpAccessTokenConfigured: boolean; mpWebhookSecretConfigured: boolean; webhookUrl: string | null }>(
      "/payment-settings"
    )
      .then((data) => {
        setMpPublicKey(data.mpPublicKey ?? "");
        setMpMode(data.mpMode ?? "sandbox");
        setMpActive(data.mpActive ?? false);
        setAccessTokenConfigured(data.mpAccessTokenConfigured);
        setWebhookSecretConfigured(data.mpWebhookSecretConfigured);
        setWebhookUrl(data.webhookUrl);
        setPixName(data.pixName ?? "");
        setPixBank(data.pixBank ?? "");
        setPixKey(data.pixKey ?? "");
        setPixKeyType((data.pixKeyType as PixKeyType) ?? "aleatoria");
        setPixQrCodeUrl(data.pixQrCodeUrl ?? null);
      })
      .finally(() => setLoading(false));
  }

  useEffect(reload, []);

  async function handleSaveMercadoPago() {
    setSaving(true);
    try {
      await adminFetch("/payment-settings", {
        method: "PUT",
        body: {
          ...(mpAccessToken.trim() ? { mpAccessToken: mpAccessToken.trim() } : {}),
          ...(mpWebhookSecret.trim() ? { mpWebhookSecret: mpWebhookSecret.trim() } : {}),
          mpPublicKey: mpPublicKey.trim() || null,
          mpMode,
          mpActive,
        },
      });
      toast.success("Configuração do Mercado Pago salva");
      setMpAccessToken("");
      setMpWebhookSecret("");
      reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao salvar configuração");
    } finally {
      setSaving(false);
    }
  }

  async function handleTestConnection() {
    setTesting(true);
    try {
      const result = await adminFetch<{ ok: boolean; message: string }>("/payment-settings/test-connection", { method: "POST" });
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao testar conexão");
    } finally {
      setTesting(false);
    }
  }

  async function handleSavePix() {
    setSaving(true);
    try {
      await adminFetch("/payment-settings", {
        method: "PUT",
        body: {
          pixName: pixName.trim() || null,
          pixBank: pixBank.trim() || null,
          pixKey: pixKey.trim() || null,
          pixKeyType,
          pixQrCodeUrl,
        },
      });
      toast.success("Dados do Pix salvos");
      reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao salvar dados do Pix");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Configurações de Pagamento</h1>
        <p className="text-sm text-muted-foreground">Credenciais do Mercado Pago e dados da chave Pix usada no checkout.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <CreditCard className="size-4 text-primary" />
          <CardTitle>Mercado Pago</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <p className="text-sm font-medium">Cartão de crédito habilitado</p>
              <p className="text-xs text-muted-foreground">Se desativado, o checkout mostra apenas Pix.</p>
            </div>
            <Switch checked={mpActive} onCheckedChange={setMpActive} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mp-token">
              Access Token {accessTokenConfigured && <span className="text-xs font-normal text-emerald-600">(configurado)</span>}
            </Label>
            <Input
              id="mp-token"
              type="password"
              value={mpAccessToken}
              onChange={(e) => setMpAccessToken(e.target.value)}
              placeholder={accessTokenConfigured ? "•••••••••••••••• (deixe em branco para manter)" : "APP_USR-..."}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mp-public">Public Key</Label>
            <Input id="mp-public" value={mpPublicKey} onChange={(e) => setMpPublicKey(e.target.value)} placeholder="APP_USR-..." />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mp-webhook-secret">
              Chave secreta do Webhook{" "}
              {webhookSecretConfigured && <span className="text-xs font-normal text-emerald-600">(configurada)</span>}
            </Label>
            <Input
              id="mp-webhook-secret"
              type="password"
              value={mpWebhookSecret}
              onChange={(e) => setMpWebhookSecret(e.target.value)}
              placeholder={webhookSecretConfigured ? "•••••••••••••••• (deixe em branco para manter)" : "Clave secreta"}
            />
          </div>

          <div className="space-y-2">
            <Label>Webhook URL</Label>
            <Input value={webhookUrl ?? "Configure API_PUBLIC_URL no servidor para exibir"} readOnly className="bg-secondary/40 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Cole esta URL nas notificações do seu aplicativo, no painel de desenvolvedores do Mercado Pago.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Modo</Label>
            <Select value={mpMode} onValueChange={(v) => setMpMode(v as MercadoPagoMode)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MERCADOPAGO_MODES.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m === "sandbox" ? "Sandbox (testes)" : "Produção"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSaveMercadoPago} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Salvar
            </Button>
            <Button variant="secondary" onClick={handleTestConnection} disabled={testing} className="gap-2">
              {testing ? <Loader2 className="size-4 animate-spin" /> : <Wifi className="size-4" />}
              Testar conexão
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <QrCode className="size-4 text-primary" />
          <CardTitle>Pix</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="pix-name">Nome do titular</Label>
              <Input id="pix-name" value={pixName} onChange={(e) => setPixName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pix-bank">Banco</Label>
              <Input id="pix-bank" value={pixBank} onChange={(e) => setPixBank(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="pix-key">Chave Pix</Label>
              <Input id="pix-key" value={pixKey} onChange={(e) => setPixKey(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Tipo da chave</Label>
              <Select value={pixKeyType} onValueChange={(v) => setPixKeyType(v as PixKeyType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PIX_KEY_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {PIX_KEY_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>QR Code (opcional)</Label>
            <SingleImageUpload value={pixQrCodeUrl} onChange={setPixQrCodeUrl} />
          </div>
          <Button onClick={handleSavePix} disabled={saving} className="w-fit gap-2">
            {saving ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
            Salvar Pix
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
