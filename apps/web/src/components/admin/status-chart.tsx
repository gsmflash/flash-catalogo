"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { PRODUCT_STATUS_LABELS, type ProductStatus } from "@flashcell/shared";

const COLORS: Record<ProductStatus, string> = {
  disponivel: "#D4AF37",
  ultima_unidade: "#B8922A",
  em_breve: "#8F7020",
  vendido: "#3D3010",
};

interface StatusChartProps {
  counts: Record<ProductStatus, number>;
}

export function StatusChart({ counts }: StatusChartProps) {
  const data = (Object.keys(counts) as ProductStatus[])
    .map((status) => ({ name: PRODUCT_STATUS_LABELS[status], value: counts[status], status }))
    .filter((d) => d.value > 0);

  if (data.length === 0) {
    return <p className="flex h-56 items-center justify-center text-sm text-muted-foreground">Sem dados ainda</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={80} paddingAngle={3}>
          {data.map((entry) => (
            <Cell key={entry.status} fill={COLORS[entry.status]} stroke="transparent" />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            borderRadius: 12,
            border: "1px solid hsl(var(--border))",
            fontSize: 13,
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
