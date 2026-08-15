import type { OrderStatus } from "@flashcell/shared";

/** Mapeia o status de pagamento do Mercado Pago para o status do pedido. */
export function mapMpStatus(mpStatus: string | undefined | null): OrderStatus {
  switch (mpStatus) {
    case "approved":
      return "pago";
    case "in_process":
    case "authorized":
      return "em_analise";
    case "rejected":
    case "cancelled":
      return "cancelado";
    case "refunded":
    case "charged_back":
      return "reembolsado";
    case "pending":
    default:
      return "pendente";
  }
}
