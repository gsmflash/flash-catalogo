"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Wallet } from "lucide-react";
import {
  FINANCIAL_ACCOUNT_TYPE_LABELS,
  FINANCIAL_ACCOUNT_TYPES,
  FINANCIAL_CATEGORY_KINDS,
  type FinancialAccountType,
  type FinancialCategoryKind,
} from "@flashcell/shared";
import { adminFetch, ApiError } from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import type { FinancialAccount, FinancialCategory } from "@/types";

const KIND_LABELS: Record<FinancialCategoryKind, string> = {
  entrada: "Entradas",
  saida_empresa: "Saídas — Empresa",
  saida_pessoal: "Saídas — Pessoal",
};

export default function FinanceiroConfiguracoesPage() {
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [categories, setCategories] = useState<FinancialCategory[]>([]);
  const [loading, setLoading] = useState(true);

  function reload() {
    Promise.all([adminFetch<FinancialAccount[]>("/financial/accounts"), adminFetch<FinancialCategory[]>("/financial/categories")])
      .then(([a, c]) => {
        setAccounts(a);
        setCategories(c);
      })
      .finally(() => setLoading(false));
  }

  useEffect(reload, []);

  async function toggleAccountActive(account: FinancialAccount) {
    try {
      await adminFetch(`/financial/accounts/${account.id}`, { method: "PUT", body: { active: !account.active } });
      reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao atualizar conta");
    }
  }

  async function deleteAccount(account: FinancialAccount) {
    if (!confirm(`Excluir a conta "${account.name}"?`)) return;
    try {
      await adminFetch(`/financial/accounts/${account.id}`, { method: "DELETE" });
      toast.success("Conta excluída");
      reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao excluir conta");
    }
  }

  async function toggleCategoryActive(category: FinancialCategory) {
    try {
      await adminFetch(`/financial/categories/${category.id}`, { method: "PUT", body: { active: !category.active } });
      reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao atualizar categoria");
    }
  }

  async function deleteCategory(category: FinancialCategory) {
    if (!confirm(`Excluir a categoria "${category.name}"? Lançamentos existentes que a usam não poderão ser excluídos.`)) return;
    try {
      await adminFetch(`/financial/categories/${category.id}`, { method: "DELETE" });
      toast.success("Categoria excluída");
      reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Não foi possível excluir — existem lançamentos usando essa categoria");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Configurações Financeiras</h1>
        <p className="text-sm text-muted-foreground">Gerencie carteiras e categorias — nenhuma taxa ou lista fica fixa no código.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Wallet className="size-4 text-primary" /> Carteiras
          </CardTitle>
          <AccountCreateDialog onSaved={reload} />
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <div key={account.id} className={`flex items-center justify-between rounded-lg border border-border p-3 ${!account.active ? "opacity-60" : ""}`}>
              <div>
                <p className="text-sm font-medium">{account.name}</p>
                <p className="text-xs text-muted-foreground">{FINANCIAL_ACCOUNT_TYPE_LABELS[account.type]}</p>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={account.active} onCheckedChange={() => toggleAccountActive(account)} />
                <Button variant="ghost" size="icon" className="size-7" onClick={() => deleteAccount(account)}>
                  <Trash2 className="size-3.5 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {FINANCIAL_CATEGORY_KINDS.map((kind) => (
        <Card key={kind}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{KIND_LABELS[kind]}</CardTitle>
            <CategoryCreateDialog kind={kind} onSaved={reload} />
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {categories
              .filter((c) => c.kind === kind)
              .map((category) => (
                <div key={category.id} className={`flex items-center justify-between rounded-lg border border-border p-3 ${!category.active ? "opacity-60" : ""}`}>
                  <p className="text-sm font-medium">{category.name}</p>
                  <div className="flex items-center gap-2">
                    <Switch checked={category.active} onCheckedChange={() => toggleCategoryActive(category)} />
                    <Button variant="ghost" size="icon" className="size-7" onClick={() => deleteCategory(category)}>
                      <Trash2 className="size-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function AccountCreateDialog({ onSaved }: { onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<FinancialAccountType>("caixa");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Informe um nome");
      return;
    }
    setSaving(true);
    try {
      await adminFetch("/financial/accounts", { method: "POST", body: { name: name.trim(), type, active: true } });
      toast.success("Conta criada");
      setOpen(false);
      setName("");
      onSaved();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao criar conta");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="size-3.5" /> Nova conta
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova conta</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="space-y-2">
            <Label htmlFor="account-name">Nome</Label>
            <Input id="account-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Banco pessoal" required />
          </div>
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={type} onValueChange={(v) => setType(v as FinancialAccountType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FINANCIAL_ACCOUNT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {FINANCIAL_ACCOUNT_TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={saving} className="gap-2">
              {saving && <Loader2 className="size-4 animate-spin" />} Criar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CategoryCreateDialog({ kind, onSaved }: { kind: FinancialCategoryKind; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Informe um nome");
      return;
    }
    setSaving(true);
    try {
      await adminFetch("/financial/categories", { method: "POST", body: { name: name.trim(), kind, sortOrder: 99, active: true } });
      toast.success("Categoria criada");
      setOpen(false);
      setName("");
      onSaved();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao criar categoria");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary" className="gap-1.5">
          <Plus className="size-3.5" /> Nova categoria
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova categoria</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="space-y-2">
            <Label htmlFor="category-name">Nome</Label>
            <Input id="category-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={saving} className="gap-2">
              {saving && <Loader2 className="size-4 animate-spin" />} Criar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
