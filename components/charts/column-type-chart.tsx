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
      <div className="flex items-center justify-center h-32 text-xs text-muted-foreground">
        No column data
      </div>
    );
  }

  return (
    <div className="w-full h-44">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="type"
            cx="50%"
            cy="50%"
            innerRadius={36}
            outerRadius={56}
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
  );
}
