"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { createUserSchema, USER_ROLES } from "@flashcell/shared";
import { adminFetch, ApiError, getStoredUser } from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";

interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  role: "admin" | "editor";
}

export default function UsuariosPage() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUserRow | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "editor">("editor");
  const [saving, setSaving] = useState(false);
  const currentUser = getStoredUser();

  function reload() {
    adminFetch<AdminUserRow[]>("/users").then(setUsers);
  }

  useEffect(reload, []);

  function openCreate() {
    setEditing(null);
    setName("");
    setEmail("");
    setPassword("");
    setRole("editor");
    setOpen(true);
  }

  function openEdit(user: AdminUserRow) {
    setEditing(user);
    setName(user.name);
    setEmail(user.email);
    setPassword("");
    setRole(user.role);
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!editing) {
      const parsed = createUserSchema.safeParse({ name, email, password, role });
      if (!parsed.success) {
        toast.error(parsed.error.issues[0]?.message ?? "Dados inválidos");
        return;
      }
    }

    setSaving(true);
    try {
      if (editing) {
        await adminFetch(`/users/${editing.id}`, {
          method: "PUT",
          body: { name, email, role, ...(password ? { password } : {}) },
        });
        toast.success("Usuário atualizado");
      } else {
        await adminFetch("/users", { method: "POST", body: { name, email, password, role } });
        toast.success("Usuário criado");
      }
      setOpen(false);
      reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao salvar usuário");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(user: AdminUserRow) {
    if (!confirm(`Excluir o usuário "${user.name}"?`)) return;
    try {
      await adminFetch(`/users/${user.id}`, { method: "DELETE" });
      toast.success("Usuário excluído");
      reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao excluir usuário");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Usuários</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="size-4" /> Novo usuário
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Editar usuário" : "Novo usuário"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="space-y-2">
                <Label htmlFor="user-name">Nome</Label>
                <Input id="user-name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-email">E-mail</Label>
                <Input id="user-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-password">{editing ? "Nova senha (deixe em branco para manter)" : "Senha"}</Label>
                <Input
                  id="user-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required={!editing}
                  minLength={8}
                />
              </div>
              <div className="space-y-2">
                <Label>Papel</Label>
                <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {USER_ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r === "admin" ? "Administrador" : "Editor"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              <th className="px-4 py-3">E-mail</th>
              <th className="px-4 py-3">Papel</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t border-border">
                <td className="px-4 py-3 font-medium">{user.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                <td className="px-4 py-3">
                  <Badge variant="outline">{user.role === "admin" ? "Administrador" : "Editor"}</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(user)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={user.id === currentUser?.id}
                      onClick={() => handleDelete(user)}
                    >
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
