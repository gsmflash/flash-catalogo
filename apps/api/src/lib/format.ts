/** Currency formatting for server-generated insight messages. */
export function formatBRLServer(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
