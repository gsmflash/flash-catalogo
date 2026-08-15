"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Search } from "lucide-react";
import { CHECKOUT_METHOD_LABELS, ORDER_STATUS_LABELS, ORDER_STATUSES, CHECKOUT_METHODS } from "@flashcell/shared";
import { adminFetch, ApiError } from "@/lib/admin-api";
import { formatBRL } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Order, OrderListResponse } from "@/types";
import type { OrderStatus } from "@flashcell/shared";

const STATUS_BADGE: Record<OrderStatus, string> = {
  pago: "border-emerald-200 bg-emerald-50 text-emerald-700",
  pendente: "border-amber-200 bg-amber-50 text-amber-700",
  em_analise: "border-blue-200 bg-blue-50 text-blue-700",
  cancelado: "border-red-200 bg-red-50 text-red-700",
  reembolsado: "border-zinc-200 bg-zinc-100 text-zinc-700",
};

export default function PedidosPage() {
  const [items, setItems] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  function reload() {
    setLoading(true);
    const params = new URLSearchParams({ pageSize: "100" });
    if (q) params.set("q", q);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (methodFilter !== "all") params.set("method", methodFilter);
    adminFetch<OrderListResponse>(`/orders?${params.toString()}`)
      .then((res) => {
        setItems(res.items);
        setTotal(res.total);
      })
      .finally(() => setLoading(false));
  }

  useEffect(reload, [q, statusFilter, methodFilter]);

  async function handleStatusChange(order: Order, status: OrderStatus) {
    setUpdatingId(order.id);
    try {
      await adminFetch(`/orders/${order.id}`, { method: "PUT", body: { status } });
      toast.success("Status atualizado");
      reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao atualizar status");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Pagamentos</h1>
        <p className="text-sm text-muted-foreground">{total} pedidos registrados pelo catálogo.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por cliente ou nº do pedido..." className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {ORDER_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {ORDER_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={methodFilter} onValueChange={setMethodFilter}>
          <SelectTrigger className="sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as formas</SelectItem>
            {CHECKOUT_METHODS.map((m) => (
              <SelectItem key={m} value={m}>
                {CHECKOUT_METHOD_LABELS[m]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Nenhum pedido encontrado.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Pedido</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Produto</th>
                <th className="px-4 py-3 text-right">Valor</th>
                <th className="px-4 py-3">Forma</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Data</th>
              </tr>
            </thead>
            <tbody>
              {items.map((order) => (
                <tr key={order.id} className="border-t border-border">
                  <td className="px-4 py-3 font-mono text-xs font-medium">#{order.orderNumber}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{order.customerName}</p>
                    <p className="text-xs text-muted-foreground">{order.customerPhone}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {order.productSnapshot.brand} {order.productSnapshot.model}
                    {order.quantity > 1 && ` ×${order.quantity}`}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">{formatBRL(order.amount)}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">
                      {CHECKOUT_METHOD_LABELS[order.method]}
                      {order.installments && order.installments > 1 ? ` ${order.installments}x` : ""}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Select
                      value={order.status}
                      onValueChange={(v) => handleStatusChange(order, v as OrderStatus)}
                      disabled={updatingId === order.id}
                    >
                      <SelectTrigger className={`h-8 w-36 border ${STATUS_BADGE[order.status]}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ORDER_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {ORDER_STATUS_LABELS[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                    {new Date(order.createdAt).toLocaleString("pt-BR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
