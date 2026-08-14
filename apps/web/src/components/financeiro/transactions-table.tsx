"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Pencil, RotateCcw, Trash2 } from "lucide-react";
import { adminFetch, ApiError } from "@/lib/admin-api";
import { formatBRL } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { TransactionStatusBadge, statusFor } from "@/components/financeiro/status-badge";
import type { FinancialAccount, FinancialCategory, FinancialTransaction } from "@/types";

interface TransactionsTableProps {
  items: FinancialTransaction[];
  categories: FinancialCategory[];
  accounts: FinancialAccount[];
  onReload: () => void;
  onEdit: (transaction: FinancialTransaction) => void;
  emptyLabel?: string;
  /** Contas a receber com taxa: mostra bruto/taxa/líquido esperado abaixo da descrição. */
  showGrossBreakdown?: boolean;
}

export function TransactionsTable({
  items,
  onReload,
  onEdit,
  emptyLabel = "Nenhum lançamento encontrado.",
  showGrossBreakdown = false,
}: TransactionsTableProps) {
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleTogglePaid(tx: FinancialTransaction) {
    setBusyId(tx.id);
    try {
      if (tx.paid) {
        await adminFetch(`/financial/transactions/${tx.id}/unpay`, { method: "PATCH" });
        toast.success("Marcado como pendente novamente");
      } else {
        await adminFetch(`/financial/transactions/${tx.id}/pay`, { method: "PATCH" });
        toast.success(tx.type === "entrada" ? "Marcado como recebido" : "Marcado como pago");
      }
      onReload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao atualizar status");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(tx: FinancialTransaction) {
    if (!confirm(`Excluir "${tx.description}"? Essa ação não pode ser desfeita.`)) return;
    setBusyId(tx.id);
    try {
      await adminFetch(`/financial/transactions/${tx.id}`, { method: "DELETE" });
      toast.success("Lançamento excluído");
      onReload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao excluir lançamento");
    } finally {
      setBusyId(null);
    }
  }

  if (items.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-secondary/50 text-left text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-4 py-3">Descrição</th>
            <th className="px-4 py-3">Categoria</th>
            <th className="px-4 py-3">Data</th>
            <th className="px-4 py-3 text-right">Valor</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {items.map((tx) => {
            const status = tx.status ?? statusFor(tx.paid, tx.dueDate);
            const isBusy = busyId === tx.id;
            return (
              <tr key={tx.id} className="border-t border-border">
                <td className="px-4 py-3">
                  <p className="font-medium">{tx.description}</p>
                  {tx.clientName && <p className="text-xs text-muted-foreground">{tx.clientName}</p>}
                  {tx.recurring && <p className="text-xs text-primary">Recorrente</p>}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{tx.category?.name ?? "—"}</td>
                <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                  {new Date(tx.dueDate ?? tx.date).toLocaleDateString("pt-BR")}
                </td>
                <td className={`px-4 py-3 text-right font-semibold ${tx.type === "entrada" ? "text-emerald-600" : "text-red-600"}`}>
                  {tx.type === "entrada" ? "+" : "-"}
                  {formatBRL(tx.amount)}
                  {showGrossBreakdown && tx.grossAmount && (
                    <p className="mt-0.5 text-xs font-normal text-muted-foreground">
                      Bruto {formatBRL(tx.grossAmount)} · Taxa {Number(tx.feePercent ?? 0).toFixed(2)}%
                    </p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <TransactionStatusBadge status={status} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleTogglePaid(tx)} disabled={isBusy} title={tx.paid ? "Desmarcar" : "Marcar como pago"}>
                      {isBusy ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : tx.paid ? (
                        <RotateCcw className="size-4 text-muted-foreground" />
                      ) : (
                        <CheckCircle2 className="size-4 text-emerald-600" />
                      )}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onEdit(tx)} disabled={isBusy}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(tx)} disabled={isBusy}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
