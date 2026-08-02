"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { categorySchema } from "@flashcell/shared";
import { adminFetch, ApiError } from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import type { Category } from "@/types";

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function CategoriasPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [saving, setSaving] = useState(false);

  function reload() {
    adminFetch<Category[]>("/categories").then(setCategories);
  }

  useEffect(reload, []);

  function openCreate() {
    setEditing(null);
    setName("");
    setSlug("");
    setSortOrder(categories.length);
    setOpen(true);
  }

  function openEdit(category: Category) {
    setEditing(category);
    setName(category.name);
    setSlug(category.slug);
    setSortOrder(category.sortOrder);
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = categorySchema.safeParse({ name, slug, sortOrder });
    if (!payload.success) {
      toast.error(payload.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await adminFetch(`/categories/${editing.id}`, { method: "PUT", body: payload.data });
        toast.success("Categoria atualizada");
      } else {
        await adminFetch("/categories", { method: "POST", body: payload.data });
        toast.success("Categoria criada");
      }
      setOpen(false);
      reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao salvar categoria");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(category: Category) {
    if (!confirm(`Excluir a categoria "${category.name}"? Produtos vinculados a ela precisam ser movidos antes.`)) return;
    try {
      await adminFetch(`/categories/${category.id}`, { method: "DELETE" });
      toast.success("Categoria excluída");
      reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao excluir categoria");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Categorias</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="size-4" /> Nova categoria
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Editar categoria" : "Nova categoria"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="space-y-2">
                <Label htmlFor="cat-name">Nome</Label>
                <Input
                  id="cat-name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!editing) setSlug(slugify(e.target.value));
                  }}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cat-slug">Slug (usado na URL)</Label>
                <Input id="cat-slug" value={slug} onChange={(e) => setSlug(slugify(e.target.value))} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cat-order">Ordem de exibição</Label>
                <Input
                  id="cat-order"
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={saving}>
                  Salvar
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Ordem</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id} className="border-t border-border">
                <td className="px-4 py-3 font-medium">{category.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{category.slug}</td>
                <td className="px-4 py-3 text-muted-foreground">{category.sortOrder}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(category)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(category)}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
