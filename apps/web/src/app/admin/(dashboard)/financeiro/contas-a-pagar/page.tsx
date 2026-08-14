"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Receipt, CalendarClock, CalendarDays } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { SummaryCard } from "@/components/financeiro/summary-card";
import { TransactionFormDialog } from "@/components/financeiro/transaction-form-dialog";
import { TransactionsTable } from "@/components/financeiro/transactions-table";
import type { FinancialAccount, FinancialCategory, FinancialTransaction, FinancialTransactionListResponse } from "@/types";

export default function ContasAPagarPage() {
  const [items, setItems] = useState<FinancialTransaction[]>([]);
  const [categories, setCategories] = useState<FinancialCategory[]>([]);
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<FinancialTransaction | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  function reload() {
    setLoading(true);
    const params = new URLSearchParams({ type: "saida", paid: "false", hasDueDate: "true", pageSize: "200" });
    adminFetch<FinancialTransactionListResponse>(`/financial/transactions?${params.toString()}`)
      .then((res) => setItems(res.items))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    adminFetch<FinancialCategory[]>("/financial/categories").then(setCategories);
    adminFetch<FinancialAccount[]>("/financial/accounts").then(setAccounts);
    reload();
  }, []);

  const totals = useMemo(() => {
    const now = new Date();
    const in7 = new Date(now);
    in7.setDate(in7.getDate() + 7);
    const in30 = new Date(now);
    in30.setDate(in30.getDate() + 30);

    let total = 0;
    let em7 = 0;
    let em30 = 0;
    for (const item of items) {
      const amount = Number(item.amount);
      total += amount;
      const due = item.dueDate ? new Date(item.dueDate) : null;
      if (due && due <= in7) em7 += amount;
      if (due && due <= in30) em30 += amount;
    }
    return { total, em7, em30 };
  }, [items]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Contas a Pagar</h1>
          <p className="text-sm text-muted-foreground">Despesas futuras e recorrentes ainda não pagas.</p>
        </div>
        <TransactionFormDialog
          type="saida"
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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryCard label="Total de contas pendentes" value={totals.total} icon={Receipt} tone="warning" />
        <SummaryCard label="Vencendo em 7 dias" value={totals.em7} icon={CalendarClock} tone="negative" />
        <SummaryCard label="Vencendo em 30 dias" value={totals.em30} icon={CalendarDays} tone="default" />
      </div>

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
          emptyLabel="Nenhuma conta a pagar pendente. 🎉"
        />
      )}
    </div>
  );
}
