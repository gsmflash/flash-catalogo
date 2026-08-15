"use client";

import { CheckCircle2, Clock, XCircle } from "lucide-react";
import type { OrderStatus } from "@flashcell/shared";
import { formatBRL } from "@/lib/format";
import { Button } from "@/components/ui/button";
import type { Order } from "@/types";

const RESULT_CONFIG: Record<OrderStatus, { icon: typeof CheckCircle2; title: string; className: string; description: string }> = {
  pago: {
    icon: CheckCircle2,
    title: "Pagamento aprovado!",
    className: "text-emerald-600",
    description: "Seu pedido foi confirmado. Em breve entraremos em contato pelo WhatsApp.",
  },
  em_analise: {
    icon: Clock,
    title: "Pagamento em análise",
    className: "text-amber-600",
    description: "Estamos aguardando a confirmação do seu pagamento. Você será avisado assim que for aprovado.",
  },
  pendente: {
    icon: Clock,
    title: "Pagamento pendente",
    className: "text-amber-600",
    description: "Aguardando confirmação do pagamento.",
  },
  cancelado: {
    icon: XCircle,
    title: "Pagamento não aprovado",
    className: "text-red-600",
    description: "Verifique os dados do cartão ou tente outra forma de pagamento.",
  },
  reembolsado: {
    icon: XCircle,
    title: "Pagamento reembolsado",
    className: "text-muted-foreground",
    description: "Este pagamento foi reembolsado.",
  },
};

export function OrderResultPanel({ order, status, onDone }: { order: Order; status: OrderStatus; onDone: () => void }) {
  const config = RESULT_CONFIG[status];
  const Icon = config.icon;

  return (
    <div className="flex flex-col items-center gap-3 py-4 text-center">
      <Icon className={`size-14 ${config.className}`} />
      <h3 className="text-lg font-bold">{config.title}</h3>
      <p className="text-sm text-muted-foreground">{config.description}</p>
      <div className="mt-2 rounded-xl border border-border p-3 text-sm">
        <p>
          Pedido <span className="font-semibold">#{order.orderNumber}</span>
        </p>
        <p className="text-muted-foreground">{formatBRL(order.amount)}</p>
      </div>
      <Button size="lg" className="mt-2 w-full" onClick={onDone}>
        Fechar
      </Button>
    </div>
  );
}
