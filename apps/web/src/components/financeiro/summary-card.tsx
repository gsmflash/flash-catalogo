import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";

interface SummaryCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  tone?: "default" | "positive" | "negative" | "warning";
  hint?: string;
}

const TONE_CLASSES: Record<NonNullable<SummaryCardProps["tone"]>, string> = {
  default: "text-foreground",
  positive: "text-emerald-600",
  negative: "text-red-600",
  warning: "text-amber-600",
};

export function SummaryCard({ label, value, icon: Icon, tone = "default", hint }: SummaryCardProps) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
          <p className={cn("mt-1 text-xl font-bold tabular-nums", TONE_CLASSES[tone])}>{formatBRL(value)}</p>
          {hint && <p className="mt-0.5 truncate text-xs text-muted-foreground">{hint}</p>}
        </div>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon className="size-5" />
        </span>
      </CardContent>
    </Card>
  );
}
