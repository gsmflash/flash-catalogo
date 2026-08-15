"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { CardPayment, initMercadoPago } from "@mercadopago/sdk-react";
import { CreditCard, Loader2, ShieldCheck, ShoppingBag } from "lucide-react";
import { CHECKOUT_METHOD_LABELS, PIX_KEY_TYPE_LABELS } from "@flashcell/shared";
import { API_URL } from "@/lib/api";
import { formatBRL } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PixPaymentPanel } from "@/components/pix-payment-panel";
import { OrderResultPanel } from "@/components/order-result-panel";
import type { Order, PublicPaymentSettings } from "@/types";

interface PurchaseDialogProps {
  product: {
    id: string;
    brand: string;
    model: string;
    color: string;
    storage: string;
    price: string | number;
    imageUrl?: string | null;
  };
  whatsapp: string;
  triggerClassName?: string;
  triggerSize?: "default" | "lg" | "sm";
}

type Step = "form" | "pix" | "cartao-brick" | "result";

let mpInitialized = false;

export function PurchaseDialog({ product, whatsapp, triggerClassName, triggerSize = "lg" }: PurchaseDialogProps) {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<PublicPaymentSettings | null>(null);
  const [method, setMethod] = useState<"pix" | "cartao">("pix");
  const [step, setStep] = useState<Step>("form");
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [creating, setCreating] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [finalStatus, setFinalStatus] = useState<Order["status"] | null>(null);

  useEffect(() => {
    if (!open) return;
    fetch(`${API_URL}/payment-settings/public`)
      .then((res) => res.json())
      .then((data: PublicPaymentSettings) => {
        setSettings(data);
        if (data.mpActive && data.mpPublicKey && !mpInitialized) {
          initMercadoPago(data.mpPublicKey, { locale: "pt-BR" });
          mpInitialized = true;
        }
      })
      .catch(() => setSettings(null));
  }, [open]);

  function resetAndClose() {
    setOpen(false);
    setTimeout(() => {
      setStep("form");
      setOrder(null);
      setFinalStatus(null);
      setCustomerName("");
      setCustomerPhone("");
      setCustomerEmail("");
      setQuantity(1);
    }, 300);
  }

  async function handleCreateOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!customerName.trim() || customerPhone.trim().length < 8) {
      toast.error("Preencha seu nome e WhatsApp");
      return;
    }
    if (method === "cartao" && !customerEmail.trim()) {
      toast.error("Informe seu e-mail para pagar no cartão");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch(`${API_URL}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          quantity,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          method,
        }),
      });
      if (!res.ok) throw new Error("Falha ao criar pedido");
      const created: Order = await res.json();
      setOrder(created);
      setStep(method === "pix" ? "pix" : "cartao-brick");
    } catch {
      toast.error("Não foi possível iniciar seu pedido. Tente novamente.");
    } finally {
      setCreating(false);
    }
  }

  const canUseCard = !!(settings?.mpActive && settings?.mpPublicKey);
  const amount = Number(product.price) * quantity;

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : resetAndClose())}>
      <DialogTrigger asChild>
        <Button size={triggerSize} className={triggerClassName ?? "w-full gap-2"}>
          <ShoppingBag className="size-4" /> Comprar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Finalizar compra</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-3 rounded-xl border border-border bg-secondary/30 p-3">
          {product.imageUrl && (
            <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-white">
              <Image src={product.imageUrl} alt={product.model} fill className="object-contain p-1" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">
              {product.brand} {product.model}
            </p>
            <p className="text-xs text-muted-foreground">
              {product.color} · {product.storage}
            </p>
          </div>
          <p className="shrink-0 text-lg font-bold text-primary">{formatBRL(amount)}</p>
        </div>

        {step === "form" && (
          <form onSubmit={handleCreateOrder} className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label>Quantidade</Label>
              <div className="flex w-fit items-center gap-3 rounded-lg border border-border px-3 py-1.5">
                <button
                  type="button"
                  className="text-lg font-semibold text-muted-foreground disabled:opacity-30"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                >
                  −
                </button>
                <span className="w-6 text-center font-medium">{quantity}</span>
                <button
                  type="button"
                  className="text-lg font-semibold text-muted-foreground disabled:opacity-30"
                  onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                  disabled={quantity >= 10}
                >
                  +
                </button>
              </div>
            </div>

            <Tabs value={method} onValueChange={(v) => setMethod(v as "pix" | "cartao")}>
              <TabsList className="w-full">
                <TabsTrigger value="pix" className="flex-1">
                  {CHECKOUT_METHOD_LABELS.pix}
                </TabsTrigger>
                <TabsTrigger value="cartao" className="flex-1" disabled={!canUseCard}>
                  <CreditCard className="mr-1.5 size-3.5" /> {CHECKOUT_METHOD_LABELS.cartao}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="pix">
                <p className="px-1 text-xs text-muted-foreground">
                  Pagamento direto pela chave Pix — sem taxa adicional do checkout.
                </p>
              </TabsContent>
              <TabsContent value="cartao">
                <p className="px-1 text-xs text-muted-foreground">
                  {canUseCard
                    ? "Pagamento parcelado processado com segurança pelo Mercado Pago."
                    : "Pagamento por cartão indisponível no momento — use o Pix."}
                </p>
              </TabsContent>
            </Tabs>

            <div className="space-y-2">
              <Label htmlFor="purchase-name">Nome completo</Label>
              <Input id="purchase-name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purchase-phone">WhatsApp</Label>
              <Input
                id="purchase-phone"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="(00) 00000-0000"
                inputMode="tel"
                required
              />
            </div>
            {method === "cartao" && (
              <div className="space-y-2">
                <Label htmlFor="purchase-email">E-mail</Label>
                <Input
                  id="purchase-email"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  required
                />
              </div>
            )}

            <Button type="submit" size="lg" disabled={creating} className="gap-2">
              {creating && <Loader2 className="size-4 animate-spin" />}
              Continuar
            </Button>
            <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5 text-primary" /> Compra segura · Pagamento protegido
            </p>
          </form>
        )}

        {step === "pix" && order && settings && (
          <PixPaymentPanel order={order} settings={settings} whatsapp={whatsapp} onDone={resetAndClose} />
        )}

        {step === "cartao-brick" && order && settings?.mpPublicKey && (
          <div className="flex flex-col gap-3">
            <CardPayment
              initialization={{ amount: Number(order.amount), payer: { email: customerEmail } }}
              customization={{ paymentMethods: { maxInstallments: 12 } }}
              onSubmit={async (formData) => {
                try {
                  const res = await fetch(`${API_URL}/orders/${order.id}/charge`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      token: formData.token,
                      installments: formData.installments,
                      paymentMethodId: formData.payment_method_id,
                      issuerId: formData.issuer_id,
                      payerEmail: formData.payer.email,
                      payerIdentificationType: formData.payer.identification?.type ?? null,
                      payerIdentificationNumber: formData.payer.identification?.number ?? null,
                    }),
                  });
                  const result = await res.json();
                  if (!res.ok) throw new Error(result?.error ?? "Falha no pagamento");
                  setOrder(result);
                  setFinalStatus(result.status);
                  setStep("result");
                } catch {
                  toast.error("Não foi possível processar o pagamento. Verifique os dados do cartão.");
                }
              }}
              onError={() => toast.error("Erro ao carregar o formulário de pagamento.")}
            />
          </div>
        )}

        {step === "result" && order && finalStatus && (
          <OrderResultPanel order={order} status={finalStatus} onDone={resetAndClose} />
        )}
      </DialogContent>
    </Dialog>
  );
}
