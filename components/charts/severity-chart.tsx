"use client";

import { AlertCircle, Flag, Info } from "lucide-react";

interface Props {
  data: { severity: string; count: number }[];
  total: number;
}

const SEVERITY_CONFIG: Record<string, { icon: typeof AlertCircle; color: string; bg: string; label: string }> = {
  danger: { icon: AlertCircle, color: "text-red-600", bg: "bg-red-50", label: "Critical" },
  warning: { icon: Flag, color: "text-amber-600", bg: "bg-amber-50", label: "Warning" },
  info: { icon: Info, color: "text-blue-500", bg: "bg-blue-50", label: "Info" },
};

export function SeverityChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 text-xs text-muted-foreground">
        No quality flags
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {data.map(({ severity, count }) => {
        const cfg = SEVERITY_CONFIG[severity];
        if (!cfg) return null;
        const Icon = cfg.icon;
        return (
          <div key={severity} className="flex items-center gap-3">
            <div className={`w-7 h-7 rounded-lg ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-mono font-medium text-foreground">{cfg.label}</span>
                <span className="text-[11px] font-mono text-muted-foreground">{count}</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${cfg.color.replace("text-", "bg-")}`} style={{ width: `${(count / data.reduce((s, d) => s + d.count, 0)) * 100}%` }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
