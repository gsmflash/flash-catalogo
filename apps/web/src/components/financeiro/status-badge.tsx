import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TransactionStatus } from "@/types";

const STATUS_CONFIG: Record<TransactionStatus, { label: string; className: string }> = {
  pago: { label: "Pago", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  pendente: { label: "Pendente", className: "border-amber-200 bg-amber-50 text-amber-700" },
  vencendo_hoje: { label: "Vencendo hoje", className: "border-orange-200 bg-orange-50 text-orange-700" },
  vencido: { label: "Vencido", className: "border-red-200 bg-red-50 text-red-700" },
};

export function TransactionStatusBadge({ status, className }: { status: TransactionStatus; className?: string }) {
  const config = STATUS_CONFIG[status];
  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}

export function statusFor(paid: boolean, dueDate: string | null): TransactionStatus {
  if (paid) return "pago";
  if (!dueDate) return "pendente";
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const due = new Date(dueDate);
  if (due < startOfToday) return "vencido";
  if (due <= endOfToday) return "vencendo_hoje";
  return "pendente";
}
