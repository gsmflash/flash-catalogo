"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Zap } from "lucide-react";
import { parseQuickEntry } from "@flashcell/shared";
import { adminFetch, ApiError } from "@/lib/admin-api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { FinancialCategoryKind, FinancialScope } from "@flashcell/shared";
import type { FinancialCategory } from "@/types";

interface QuickEntryBarProps {
  categories: FinancialCategory[];
  categoryKind: FinancialCategoryKind;
  scope: FinancialScope;
  onSaved: () => void;
}

/**
 * "Gasolina 100" -> lançamento de saída pronto em um campo só, pensado pra
 * registrar em segundos pelo celular (item 18/10 do módulo Financeiro).
 */
export function QuickEntryBar({ categories, categoryKind, scope, onSaved }: QuickEntryBarProps) {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;

    const parsed = parseQuickEntry(text, categories, categoryKind);
    if (!parsed.amount || parsed.amount <= 0) {
      toast.error('Inclua um valor no final, ex: "Gasolina 100"');
      return;
    }
    if (!parsed.categoryId) {
      toast.error("Cadastre ao menos uma categoria antes de usar o lançamento rápido");
      return;
    }

    setSaving(true);
    try {
      await adminFetch("/financial/transactions", {
        method: "POST",
        body: {
          type: "saida",
          scope,
          description: parsed.description,
          amount: parsed.amount,
          categoryId: parsed.categoryId,
          date: new Date().toISOString(),
          paid: true,
        },
      });
      toast.success(`"${parsed.description}" registrado`);
      setText("");
      onSaved();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao registrar gasto");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 rounded-xl border border-dashed border-primary/30 bg-primary/5 p-2.5">
      <Zap className="size-4 shrink-0 text-primary" />
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Lançamento rápido: Gasolina 100"
        inputMode="text"
        className="h-9 border-0 bg-transparent shadow-none focus-visible:ring-0"
      />
      <Button type="submit" size="sm" disabled={saving} className="shrink-0 gap-1.5">
        {saving ? <Loader2 className="size-3.5 animate-spin" /> : "Adicionar"}
      </Button>
    </form>
  );
}
