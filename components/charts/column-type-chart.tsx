"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";

interface Props {
  data: { type: string; count: number }[];
}

const COLORS: Record<string, string> = {
  numeric: "#C4622D",
  text: "#4A7C7C",
  date: "#8B6F9E",
  unknown: "#B0ADAA",
};

export function ColumnTypeChart({ data }: Props) {
  const total = data.reduce((s, d) => s + d.count, 0);

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-20 text-xs text-muted-foreground">
        No type data
      </div>
    );
  }

  return (
    <div className="flex items-center gap-5">
      <div className="w-28 h-28 flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="type"
              cx="50%"
              cy="50%"
              innerRadius={24}
              outerRadius={40}
              strokeWidth={0}
            >
              {data.map((d) => (
                <Cell key={d.type} fill={COLORS[d.type] ?? "#B0ADAA"} />
              ))}
            </Pie>
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              iconSize={6}
              formatter={(value: string) => (
                <span style={{ fontSize: 10, fontFamily: "var(--font-jetbrains)", color: "#7A776F" }}>
                  {value} ({data.find((d) => d.type === value)?.count ?? 0})
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="text-[11px] font-mono space-y-1 text-muted-foreground">
        {data.map((d) => (
          <div key={d.type} className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: COLORS[d.type] ?? "#B0ADAA" }}
            />
            <span>{d.type}</span>
            <span className="text-foreground font-semibold">{d.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
