"use client";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

interface DistributionBin {
  col: string;
  binStart: number;
  binEnd: number;
  count: number;
}

interface Props {
  data: DistributionBin[];
}

const BAR_COLORS = ["#C4622D", "#D68B5C", "#E8B48B", "#7A9E9E"];

export function DistributionChart({ data }: Props) {
  const cols = [...new Set(data.map((d) => d.col))].slice(0, 6);

  if (cols.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 text-xs text-muted-foreground">
        No numeric columns to distribute
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {cols.map((col, ci) => {
        const bins = data.filter((d) => d.col === col).sort((a, b) => a.binStart - b.binStart);
        const maxCount = Math.max(...bins.map((b) => b.count), 1);
        if (bins.length < 2) return null;
        return (
          <div key={col}>
            <p className="text-[11px] font-mono font-semibold text-foreground mb-2">{col}</p>
            <div className="h-28">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bins.map((b) => ({ ...b, label: `${b.binStart}–${b.binEnd}` }))} margin={{ left: 8, right: 8, top: 4, bottom: 4 }}>
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 8, fontFamily: "var(--font-jetbrains)" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis hide domain={[0, maxCount]} />
                  <Tooltip
                    contentStyle={{ fontSize: 10, fontFamily: "var(--font-jetbrains)", borderRadius: 6, border: "1px solid #E0DDD7" }}
                    formatter={(value: any) => [`${value} rows`, "Count"]}
                  />
                  <Bar dataKey="count" radius={[2, 2, 0, 0]} barSize={Math.max(6, Math.min(20, 240 / bins.length))}>
                    {bins.map((_, i) => (
                      <Cell key={i} fill={BAR_COLORS[ci % BAR_COLORS.length]} opacity={0.6 + 0.4 * (bins[i].count / maxCount)} />
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
