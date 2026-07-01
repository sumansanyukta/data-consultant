"use client";

interface CorrelationPair {
  colA: string;
  colB: string;
  r: number;
}

interface Props {
  data: CorrelationPair[];
  allColumns: string[];
}

function heatBg(r: number): string {
  const abs = Math.abs(r);
  if (abs > 0.7) return r > 0 ? "bg-emerald-500" : "bg-rose-500";
  if (abs > 0.5) return r > 0 ? "bg-emerald-400" : "bg-rose-400";
  if (abs > 0.3) return r > 0 ? "bg-emerald-300" : "bg-rose-300";
  if (abs > 0.2) return r > 0 ? "bg-emerald-200" : "bg-rose-200";
  return "bg-muted/50";
}

export function CorrelationHeatmap({ data, allColumns }: Props) {
  const numericCols = allColumns.filter((c) =>
    data.some((p) => p.colA === c || p.colB === c)
  );

  if (numericCols.length < 2) {
    return (
      <div className="flex items-center justify-center h-24 text-xs text-muted-foreground">
        Not enough numeric columns for correlation
      </div>
    );
  }

  const cols = numericCols.slice(0, 10);

  const getR = (a: string, b: string): number | null => {
    if (a === b) return 1;
    const found = data.find((p) =>
      (p.colA === a && p.colB === b) || (p.colA === b && p.colB === a)
    );
    return found ? found.r : null;
  };

  return (
    <div className="overflow-x-auto">
      <div className="inline-flex flex-col gap-0.5">
        {/* Header row */}
        <div className="flex items-center gap-0.5 pl-[84px] mb-1">
          {cols.map((col) => (
            <div
              key={col}
              className="w-8 text-[9px] font-mono text-muted-foreground text-center leading-tight"
            >
              {col.length > 8 ? col.slice(0, 8) + "…" : col}
            </div>
          ))}
        </div>
        {/* Rows */}
        {cols.map((row) => (
          <div key={row} className="flex items-center gap-0.5">
            <div className="w-[80px] text-right pr-2 text-[10px] font-mono text-muted-foreground truncate">
              {row.length > 12 ? row.slice(0, 12) + "…" : row}
            </div>
            {cols.map((col) => {
              const r = getR(row, col);
              const displayR = r !== null ? r.toFixed(2) : "—";
              return (
                <div
                  key={`${row}-${col}`}
                  title={r !== null ? `${row} × ${col}: ${r}` : "—"}
                  className={`w-8 h-7 rounded-[4px] flex items-center justify-center text-[9px] font-mono font-semibold ${
                    r !== null ? heatBg(r) : "bg-muted/30"
                  } ${r !== null && Math.abs(r) > 0.4 ? "text-white" : "text-muted-foreground"}`}
                >
                  {displayR}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 mt-2 text-[10px] font-mono text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-emerald-400" /> Positive</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-rose-400" /> Negative</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-muted/50" /> Weak / none</span>
      </div>
    </div>
  );
}
