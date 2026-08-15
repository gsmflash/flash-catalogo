export interface WhatsAppMessageInput {
  brand: string;
  model: string;
  storage: string;
}

export function buildWhatsAppMessage({ brand, model, storage }: WhatsAppMessageInput): string {
  return [
    "Olá!",
    "Tenho interesse no aparelho:",
    `${brand} ${model}`,
    `Memória: ${storage}`,
    "Vi este aparelho no catálogo da Flash Cell e gostaria de mais informações.",
  ].join("\n");
}

/** Builds a wa.me link. `phone` must be digits only, with country code (e.g. 5511999999999). */
export function buildWhatsAppLink(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export interface OrderConfirmationMessageInput {
  orderNumber: string;
  brand: string;
  model: string;
  storage: string;
  amount: string;
}

/** Message the customer sends with the Pix receipt so the store can confirm the order. */
export function buildOrderConfirmationMessage({ orderNumber, brand, model, storage, amount }: OrderConfirmationMessageInput): string {
  return [
    "Olá! Acabei de fazer um pedido no catálogo da Flash Cell e vou enviar o comprovante do Pix.",
    `Pedido: #${orderNumber}`,
    `Aparelho: ${brand} ${model} (${storage})`,
    `Valor: ${amount}`,
  ].join("\n");
}
