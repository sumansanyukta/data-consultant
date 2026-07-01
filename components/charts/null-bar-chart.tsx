"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface Props {
  data: { name: string; nullPct: number }[];
}

const BAR_COLORS = ["#C4622D", "#D68B5C", "#E8B48B", "#F2D7BB", "#F7E8DA"];

export function NullBarChart({ data }: Props) {
  const sorted = [...data].sort((a, b) => b.nullPct - a.nullPct).slice(0, 15);

  if (sorted.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-xs text-muted-foreground">
        No column data available
      </div>
    );
  }

  return (
    <div className="w-full h-52">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={sorted} layout="vertical" margin={{ left: 80, right: 20, top: 4, bottom: 4 }}>
          <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fontFamily: "var(--font-jetbrains)" }} tickLine={false} axisLine={false} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fontFamily: "var(--font-jetbrains)" }} tickLine={false} axisLine={false} width={70} />
          <Tooltip
            contentStyle={{ fontSize: 11, fontFamily: "var(--font-jetbrains)", borderRadius: 8, border: "1px solid #E0DDD7" }}
            formatter={(value: any) => [`${value}% null`, "Null rate"]}
          />
          <Bar dataKey="nullPct" radius={[0, 4, 4, 0]} barSize={14}>
            {sorted.map((_, i) => (
              <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
