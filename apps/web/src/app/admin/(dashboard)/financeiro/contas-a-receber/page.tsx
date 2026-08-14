"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, HandCoins } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { SummaryCard } from "@/components/financeiro/summary-card";
import { TransactionFormDialog } from "@/components/financeiro/transaction-form-dialog";
import { TransactionsTable } from "@/components/financeiro/transactions-table";
import type { FinancialAccount, FinancialCategory, FinancialTransaction, FinancialTransactionListResponse } from "@/types";

export default function ContasAReceberPage() {
  const [items, setItems] = useState<FinancialTransaction[]>([]);
  const [categories, setCategories] = useState<FinancialCategory[]>([]);
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<FinancialTransaction | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  function reload() {
    setLoading(true);
    const params = new URLSearchParams({ type: "entrada", paid: "false", hasDueDate: "true", pageSize: "200" });
    adminFetch<FinancialTransactionListResponse>(`/financial/transactions?${params.toString()}`)
      .then((res) => setItems(res.items))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    adminFetch<FinancialCategory[]>("/financial/categories").then(setCategories);
    adminFetch<FinancialAccount[]>("/financial/accounts").then(setAccounts);
    reload();
  }, []);

  const totalLiquido = useMemo(() => items.reduce((s, i) => s + Number(i.amount), 0), [items]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Contas a Receber</h1>
          <p className="text-sm text-muted-foreground">
            Valores a receber, já considerando taxas de venda — só o líquido esperado entra no fluxo de caixa.
          </p>
        </div>
        <TransactionFormDialog
          type="entrada"
          categories={categories}
          accounts={accounts}
          onSaved={reload}
          defaultPending
          editing={editing}
          open={formOpen}
          onOpenChange={(o) => {
            setFormOpen(o);
            if (!o) setEditing(null);
          }}
        />
      </div>

      <SummaryCard label="Total líquido a receber" value={totalLiquido} icon={HandCoins} tone="default" />

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <TransactionsTable
          items={items}
          categories={categories}
          accounts={accounts}
          onReload={reload}
          onEdit={(tx) => {
            setEditing(tx);
            setFormOpen(true);
          }}
          emptyLabel="Nenhuma conta a receber pendente."
          showGrossBreakdown
        />
      )}
    </div>
  );
}
