import type { InstallmentOption } from "@flashcell/shared";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";

export function InstallmentTable({ pricing }: { pricing: InstallmentOption[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <table className="w-full text-sm">
        <tbody>
          {pricing.map((option) => (
            <tr
              key={`${option.method}-${option.installments}`}
              className={cn("border-b border-border last:border-0", option.installments === 1 && option.method === "credito" && "bg-secondary/50")}
            >
              <td className="px-4 py-2 text-muted-foreground">
                {option.method === "debito" ? "Débito" : option.installments === 1 ? "Crédito à vista" : `${option.installments}x no cartão`}
              </td>
              <td className="px-4 py-2 text-right font-medium">
                {option.installments === 1 ? formatBRL(option.total) : `${formatBRL(option.perInstallment)}/mês`}
              </td>
              <td className="px-4 py-2 text-right text-xs text-muted-foreground">
                {option.installments > 1 ? `total ${formatBRL(option.total)}` : ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
