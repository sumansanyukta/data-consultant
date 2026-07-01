"use client";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

interface TopValue {
  col: string;
  value: string;
  count: number;
}

interface Props {
  data: TopValue[];
}

const PALETTE = ["#C4622D", "#D68B5C", "#E8B48B", "#7A9E9E", "#8B6F9E", "#B0ADAA"];

export function TopValuesChart({ data }: Props) {
  const cols = [...new Set(data.map((d) => d.col))].slice(0, 4);

  if (cols.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 text-xs text-muted-foreground">
        No text columns to analyse
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {cols.map((col, ci) => {
        const vals = data.filter((d) => d.col === col).slice(0, 6);
        const maxCount = Math.max(...vals.map((v) => v.count), 1);
        if (vals.length === 0) return null;
        return (
          <div key={col}>
            <p className="text-[11px] font-mono font-semibold text-foreground mb-2">{col}</p>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vals} layout="vertical" margin={{ left: 80, right: 16, top: 2, bottom: 2 }}>
                  <XAxis type="number" tick={{ fontSize: 9, fontFamily: "var(--font-jetbrains)" }} tickLine={false} axisLine={false} />
                  <YAxis
                    type="category"
                    dataKey="value"
                    tick={{ fontSize: 9, fontFamily: "var(--font-jetbrains)" }}
                    tickLine={false}
                    axisLine={false}
                    width={72}
                  />
                  <Tooltip
                    contentStyle={{ fontSize: 10, fontFamily: "var(--font-jetbrains)", borderRadius: 6, border: "1px solid #E0DDD7" }}
                    formatter={(value: any) => [`${value} occurrences`, "Frequency"]}
                  />
                  <Bar dataKey="count" radius={[0, 3, 3, 0]} barSize={12}>
                    {vals.map((entry, i) => (
                      <Cell key={i} fill={PALETTE[ci % PALETTE.length]} opacity={0.4 + 0.6 * (entry.count / maxCount)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      })}
    </div>
  );
}
