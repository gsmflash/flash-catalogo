"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { formatBRL } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TransactionFormDialog } from "@/components/financeiro/transaction-form-dialog";
import { TransactionsTable } from "@/components/financeiro/transactions-table";
import type { FinancialAccount, FinancialCategory, FinancialTransaction, FinancialTransactionListResponse } from "@/types";

export default function EntradasPage() {
  const [items, setItems] = useState<FinancialTransaction[]>([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState<FinancialCategory[]>([]);
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [paidFilter, setPaidFilter] = useState("all");
  const [editing, setEditing] = useState<FinancialTransaction | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  function reload() {
    setLoading(true);
    const params = new URLSearchParams({ type: "entrada", pageSize: "100" });
    if (q) params.set("q", q);
    if (categoryFilter !== "all") params.set("categoryId", categoryFilter);
    if (paidFilter !== "all") params.set("paid", paidFilter);
    adminFetch<FinancialTransactionListResponse>(`/financial/transactions?${params.toString()}`)
      .then((res) => {
        setItems(res.items);
        setTotal(res.total);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    adminFetch<FinancialCategory[]>("/financial/categories").then(setCategories);
    adminFetch<FinancialAccount[]>("/financial/accounts").then(setAccounts);
  }, []);

  useEffect(reload, [q, categoryFilter, paidFilter]);

  const entradaCategories = categories.filter((c) => c.kind === "entrada");
  const totalEntradas = items.reduce((s, i) => s + (i.paid ? Number(i.amount) : 0), 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Entradas</h1>
          <p className="text-sm text-muted-foreground">
            {total} lançamento{total === 1 ? "" : "s"} · {formatBRL(totalEntradas)} recebidos nesta lista
          </p>
        </div>
        <TransactionFormDialog
          type="entrada"
          categories={categories}
          accounts={accounts}
          onSaved={reload}
          editing={editing}
          open={formOpen}
          onOpenChange={(o) => {
            setFormOpen(o);
            if (!o) setEditing(null);
          }}
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por descrição ou cliente..." className="sm:max-w-xs" />
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="sm:w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {entradaCategories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={paidFilter} onValueChange={setPaidFilter}>
          <SelectTrigger className="sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="true">Recebidos</SelectItem>
            <SelectItem value="false">A receber</SelectItem>
          </SelectContent>
        </Select>
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
          emptyLabel="Nenhuma entrada registrada ainda."
        />
      )}
    </div>
  );
}
