import type { InstallmentOption } from "@flashcell/shared";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";

export function InstallmentTable({ pricing }: { pricing: InstallmentOption[] }) {
  const maxInstallments = Math.max(...pricing.map((p) => p.installments));

  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      <table className="w-full text-sm">
        <tbody>
          {pricing.map((option) => {
            const isBest = option.installments === maxInstallments && option.method === "credito";
            return (
              <tr
                key={`${option.method}-${option.installments}`}
                className={cn(
                  "border-b border-border/70 last:border-0",
                  option.method === "pix" && "bg-secondary/50",
                  option.installments === 1 && option.method === "credito" && "bg-secondary/50",
                  isBest && "bg-primary/5"
                )}
              >
                <td className="px-4 py-2.5 text-muted-foreground">
                  {option.method === "pix"
                    ? "Pix"
                    : option.method === "debito"
                      ? "Débito"
                      : option.installments === 1
                        ? "Crédito à vista"
                        : `${option.installments}x no cartão`}
                </td>
                <td className={cn("px-4 py-2.5 text-right font-semibold", isBest && "text-primary")}>
                  {option.installments === 1 ? formatBRL(option.total) : `${formatBRL(option.perInstallment)}/mês`}
                </td>
                <td className="px-4 py-2.5 text-right text-xs text-muted-foreground">
                  {option.installments > 1 ? `total ${formatBRL(option.total)}` : ""}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
