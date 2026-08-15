"use client";

import Image from "next/image";
import { toast } from "sonner";
import { Copy, MessageCircle } from "lucide-react";
import { buildOrderConfirmationMessage, buildWhatsAppLink, PIX_KEY_TYPE_LABELS } from "@flashcell/shared";
import { formatBRL } from "@/lib/format";
import { Button } from "@/components/ui/button";
import type { Order, PublicPaymentSettings } from "@/types";

interface PixPaymentPanelProps {
  order: Order;
  settings: PublicPaymentSettings;
  whatsapp: string;
  onDone: () => void;
}

export function PixPaymentPanel({ order, settings, whatsapp, onDone }: PixPaymentPanelProps) {
  const hasPixKey = !!settings.pixKey;

  async function copyKey() {
    if (!settings.pixKey) return;
    await navigator.clipboard.writeText(settings.pixKey);
    toast.success("Chave Pix copiada");
  }

  const waLink = buildWhatsAppLink(
    whatsapp,
    buildOrderConfirmationMessage({
      orderNumber: order.orderNumber,
      brand: order.productSnapshot.brand,
      model: order.productSnapshot.model,
      storage: order.productSnapshot.storage,
      amount: formatBRL(order.amount),
    })
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-center">
        <p className="text-xs text-muted-foreground">Valor a pagar</p>
        <p className="text-3xl font-extrabold text-primary">{formatBRL(order.amount)}</p>
        <p className="mt-1 text-xs text-muted-foreground">Pedido #{order.orderNumber}</p>
      </div>

      {!hasPixKey ? (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
          A chave Pix ainda não foi cadastrada. Fale com a loja pelo WhatsApp para combinar o pagamento.
        </p>
      ) : (
        <div className="flex flex-col gap-3 rounded-xl border border-border p-4">
          {settings.pixQrCodeUrl && (
            <div className="relative mx-auto size-44 overflow-hidden rounded-lg border border-border bg-white">
              <Image src={settings.pixQrCodeUrl} alt="QR Code Pix" fill className="object-contain p-2" />
            </div>
          )}
          <div>
            <p className="text-xs text-muted-foreground">
              {settings.pixKeyType ? PIX_KEY_TYPE_LABELS[settings.pixKeyType] : "Chave Pix"}
              {settings.pixBank ? ` · ${settings.pixBank}` : ""}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <code className="flex-1 truncate rounded-lg bg-secondary/60 px-3 py-2 text-sm">{settings.pixKey}</code>
              <Button type="button" variant="secondary" size="icon" onClick={copyKey}>
                <Copy className="size-4" />
              </Button>
            </div>
            {settings.pixName && <p className="mt-1 text-xs text-muted-foreground">Titular: {settings.pixName}</p>}
          </div>
        </div>
      )}

      <p className="rounded-lg bg-secondary/40 p-3 text-sm text-muted-foreground">
        Após realizar o Pix, envie o comprovante pelo WhatsApp para confirmação do pedido.
      </p>

      <Button asChild size="lg" className="gap-2 bg-emerald-600 hover:bg-emerald-700">
        <a href={waLink} target="_blank" rel="noopener noreferrer" onClick={onDone}>
          <MessageCircle className="size-4" /> Enviar comprovante pelo WhatsApp
        </a>
      </Button>
    </div>
  );
}
