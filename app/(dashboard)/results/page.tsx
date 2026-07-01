"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  AlertCircle,
  Flag,
  Info,
  MessageSquare,
  Lightbulb,
  Loader2,
  Save,
  CheckCircle2,
  Download,
  Database,
  BarChart3,
  Shield,
} from "lucide-react";
import { useSessionDetail } from "@/lib/supabase/hooks";
import { addConsultantNote } from "@/lib/supabase/queries";
import { NullBarChart } from "@/components/charts/null-bar-chart";
import { ColumnTypeChart } from "@/components/charts/column-type-chart";
import { SeverityChart } from "@/components/charts/severity-chart";
import { CorrelationHeatmap } from "@/components/charts/correlation-heatmap";
import { DistributionChart } from "@/components/charts/distribution-chart";
import { TopValuesChart } from "@/components/charts/top-values-chart";

function ResultsInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId") ?? "";
  const { data, loading, refetch } = useSessionDetail(sessionId);
  const [notes, setNotes] = useState("");
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  const session = data?.session;
  const output = data?.output;
  const input = data?.input;

  if (!session || !output) {
    return (
      <div className="p-8">
        <p className="text-sm text-muted-foreground">No results found for this session.</p>
      </div>
    );
  }

  const dataFile = input?.dataFiles?.[0];
  const nullPct = dataFile?.nullPct ?? {};
  const dtypes = dataFile?.dtypes ?? {};
  const columns = dataFile?.columns ?? [];
  const rowCount = dataFile?.rowCount ?? 0;
  const colCount = dataFile?.columnCount ?? 0;

  const nullData = Object.entries(nullPct).map(([name, pct]) => ({ name, nullPct: pct }));
  const typeCounts: Record<string, number> = {};
  for (const dt of Object.values(dtypes)) typeCounts[dt] = (typeCounts[dt] ?? 0) + 1;
  const typeData = Object.entries(typeCounts).map(([type, count]) => ({ type, count }));

  const severityCounts: Record<string, number> = {};
  for (const f of output.dataQualityFlags ?? []) severityCounts[f.severity] = (severityCounts[f.severity] ?? 0) + 1;
  const severityData = Object.entries(severityCounts).map(([severity, count]) => ({ severity, count }));

  const analyses = output.recommendedAnalyses ?? [];
  const signals = output.keySignals ?? [];
  const flags = output.dataQualityFlags ?? [];

  const statCards = [
    { label: "Confidence", value: `${output.confidenceScore}%`, icon: Shield, color: output.confidenceScore >= 75 ? "text-emerald-600 bg-emerald-50" : output.confidenceScore >= 55 ? "text-amber-600 bg-amber-50" : "text-red-600 bg-red-50" },
    { label: "Completeness", value: `${output.dataCompleteness}%`, icon: Database, color: output.dataCompleteness >= 75 ? "text-emerald-600 bg-emerald-50" : output.dataCompleteness >= 55 ? "text-amber-600 bg-amber-50" : "text-red-600 bg-red-50" },
    { label: "Columns", value: String(colCount), icon: BarChart3, color: "text-blue-500 bg-blue-50" },
    { label: "Rows", value: rowCount.toLocaleString(), icon: Database, color: "text-purple-500 bg-purple-50" },
    { label: "Flags", value: String(flags.length), icon: Flag, color: flags.length > 0 ? "text-amber-600 bg-amber-50" : "text-emerald-600 bg-emerald-50" },
  ];

  const downloadReport = () => {
    const lines = [
      "UNWRITTEN DATA — Analysis Report",
      "=".repeat(50),
      "",
      `Session: ${session.title}`,
      `Confidence: ${output.confidenceScore}% · Completeness: ${output.dataCompleteness}%`,
      `Rows: ${rowCount} · Columns: ${colCount} · Flags: ${flags.length}`,
      "",
      "COLUMN HEALTH",
      "-".repeat(50),
      ...nullData.map((c) => `  ${c.name}: ${c.nullPct}% null`),
      "",
      "COLUMN TYPES",
      "-".repeat(50),
      ...typeData.map((t) => `  ${t.type}: ${t.count}`),
      "",
      "SIGNALS",
      "-".repeat(50),
      ...signals.map((s: string) => `  • ${s}`),
      "",
      "RECOMMENDED ANALYSES",
      "-".repeat(50),
      ...analyses.map((a: any) => `  ${a.title} (${a.confidence}%)\n    ${a.desc}`),
      "",
      "FLAGS",
      "-".repeat(50),
      ...(flags.length > 0 ? flags.map((f: any) => `  [${f.severity}] ${f.field}: ${f.issue}`) : ["  None"]),
      "",
      "=".repeat(50),
      `Generated ${new Date().toLocaleDateString("en-GB")}`,
    ].join("\n");
    const blob = new Blob([lines], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${session.title.replace(/[^a-zA-Z0-9]/g, "_")}_report.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1 font-mono">
            <span>{session.title}</span>
          </div>
          <h1 className="text-2xl font-semibold text-foreground" style={{ fontFamily: "var(--font-lora), serif" }}>
            Results
          </h1>
        </div>
        <div className="flex items-center gap-2.5">
          <button onClick={downloadReport} className="flex items-center gap-1.5 bg-card border border-border text-foreground px-3.5 py-2 rounded-xl text-xs font-medium hover:bg-muted transition-colors">
            <Download className="w-3.5 h-3.5" />
            Export report
          </button>
          <button onClick={() => router.push(`/next-steps?sessionId=${sessionId}`)} className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3.5 py-2 rounded-xl text-xs font-medium hover:bg-primary/90 transition-colors">
            View tasks
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-card border border-border rounded-[14px] p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl ${color.split(" ")[1]} flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-4 h-4 ${color.split(" ")[0]}`} />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground font-mono">{value}</p>
              <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-5 gap-5 mb-6">
        <div className="col-span-3 bg-card border border-border rounded-[14px] p-5">
          <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase font-mono mb-3">Column Health — Null Rate</p>
          <NullBarChart data={nullData} />
        </div>
        <div className="col-span-2 space-y-4">
          <div className="bg-card border border-border rounded-[14px] p-5">
            <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase font-mono mb-2">Column Types</p>
            <ColumnTypeChart data={typeData} />
          </div>
          <div className="bg-card border border-border rounded-[14px] p-5">
            <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase font-mono mb-3">Quality Flags by Severity</p>
            <SeverityChart data={severityData} total={flags.length} />
          </div>
        </div>
      </div>

      {/* Stats visual sections */}
      {(() => {
        const stats = output.statSummary;
        if (!stats) return null;
        return (
          <div className="space-y-5 mb-6">
            {/* Correlations */}
            {stats.correlations?.length > 0 && (
              <div className="bg-card border border-border rounded-[14px] p-5">
                <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase font-mono mb-3">Statistical Correlations</p>
                <CorrelationHeatmap data={stats.correlations} allColumns={columns} />
              </div>
            )}

            {/* Distributions */}
            {stats.distributions?.length > 0 && (
              <div className="bg-card border border-border rounded-[14px] p-5">
                <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase font-mono mb-3">Value Distributions</p>
                <DistributionChart data={stats.distributions} />
              </div>
            )}

            {/* Top values */}
            {stats.topValues?.length > 0 && (
              <div className="bg-card border border-border rounded-[14px] p-5">
                <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase font-mono mb-3">Most Frequent Values</p>
                <TopValuesChart data={stats.topValues} />
              </div>
            )}

            {/* Outliers */}
            {stats.outliers?.length > 0 && (
              <div className="bg-card border border-border rounded-[14px] p-5">
                <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase font-mono mb-3">Anomaly Detection — Outliers (IQR method)</p>
                <div className="space-y-1.5">
                  {stats.outliers.slice(0, 10).map((o: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-[11px] font-mono">
                      <span className="text-muted-foreground w-24 truncate">{o.col}</span>
                      <span className="text-amber-600 font-semibold">{o.value}</span>
                      <span className="text-muted-foreground">row {o.row + 2}</span>
                    </div>
                  ))}
                  {stats.outliers.length > 10 && (
                    <p className="text-[10px] text-muted-foreground font-mono">+{stats.outliers.length - 10} more</p>
                  )}
                </div>
              </div>
            )}

            {/* Correlation highlights */}
            {stats.correlations?.length > 0 && (
              <div className="bg-card border border-border rounded-[14px] p-5">
                <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase font-mono mb-3">Key Relationships</p>
                <div className="space-y-1.5">
                  {stats.correlations.slice(0, 5).map((pair: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-[11px] font-mono">
                      <div className={`w-2 h-2 rounded-full ${pair.r > 0 ? "bg-emerald-500" : "bg-rose-500"}`} />
                      <span className="text-foreground">{pair.colA}</span>
                      <span className="text-muted-foreground">×</span>
                      <span className="text-foreground">{pair.colB}</span>
                      <span className="text-muted-foreground">r =</span>
                      <span className={pair.r > 0.5 ? "text-emerald-600 font-semibold" : pair.r < -0.5 ? "text-rose-600 font-semibold" : "text-muted-foreground"}>{pair.r}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Suggested KPIs */}
      {output.suggestedKpis && output.suggestedKpis.length > 0 && (
        <div className="mb-6">
          <div className="bg-card border border-border rounded-[14px] p-5">
            <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase font-mono mb-4">Suggested KPIs</p>
            <div className="grid grid-cols-2 gap-3">
              {output.suggestedKpis.map((kpi: any, i: number) => (
                <div key={i} className={`rounded-xl p-4 border ${
                  kpi.priority === "high"
                    ? "bg-emerald-50/50 border-emerald-200"
                    : kpi.priority === "medium"
                    ? "bg-amber-50/50 border-amber-200"
                    : "bg-muted/30 border-border"
                }`}>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="text-xs font-semibold text-foreground">{kpi.name}</span>
                    <span className={`text-[10px] font-mono uppercase tracking-wider font-semibold ${
                      kpi.priority === "high" ? "text-emerald-700" : kpi.priority === "medium" ? "text-amber-700" : "text-muted-foreground"
                    }`}>
                      {kpi.priority}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed mb-2">{kpi.description}</p>
                  <code className="block text-[10px] font-mono bg-card border border-border rounded-lg px-2.5 py-1.5 text-foreground/80">{kpi.formula}</code>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Signals + Analyses row */}
      <div className="grid grid-cols-5 gap-5 mb-6">
        <div className="col-span-3 space-y-4">
          {analyses.length > 0 && (
            <div className="bg-card border border-border rounded-[14px] p-5">
              <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase font-mono mb-3">Recommended Analyses</p>
              <div className="space-y-2.5">
                {analyses.slice(0, 4).map((a, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-muted/40">
                    <div className="w-5 h-5 rounded-lg bg-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[10px] font-mono font-semibold text-primary">{String(i + 1).padStart(2, "0")}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="text-xs font-semibold text-foreground truncate">{a.title}</span>
                        <span className="text-[10px] font-mono text-muted-foreground flex-shrink-0">{a.confidence}%</span>
                      </div>
                      <div className="h-1 bg-muted rounded-full overflow-hidden mb-1 max-w-[120px]">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${a.confidence}%` }} />
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{a.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {signals.length > 0 && (
            <div className="bg-card border border-border rounded-[14px] p-5">
              <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase font-mono mb-3">Key Signals</p>
              <div className="flex flex-wrap gap-1.5">
                {signals.slice(0, 6).map((s, i) => (
                  <span key={i} className="text-[11px] bg-accent text-accent-foreground px-2.5 py-1 rounded-lg font-medium leading-snug">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="col-span-2 space-y-4">
          {flags.length > 0 && (
            <div className="bg-card border border-border rounded-[14px] p-5">
              <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase font-mono mb-3">Data Quality Flags</p>
              <div className="space-y-2">
                {flags.map((f, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-[11px]">
                    {f.severity === "danger" ? <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" /> : f.severity === "warning" ? <Flag className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" /> : <Info className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />}
                    <div>
                      <code className="text-[10px] font-mono bg-muted px-1 py-0.5 rounded text-foreground">{f.field}</code>
                      <p className="text-muted-foreground mt-0.5">{f.issue}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {output.followUpQuestions && output.followUpQuestions.length > 0 && (
            <div className="bg-card border border-border rounded-[14px] p-5">
              <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase font-mono mb-2.5">Follow-up Questions</p>
              <div className="space-y-2">
                {output.followUpQuestions.slice(0, 3).map((q, i) => (
                  <div key={i} className="flex items-start gap-2 text-[11px]">
                    <MessageSquare className="w-3 h-3 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{q}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {output.assumptions && output.assumptions.length > 0 && (
            <div className="bg-card border border-border rounded-[14px] p-5">
              <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase font-mono mb-2.5">Assumptions</p>
              <div className="space-y-1.5">
                {output.assumptions.slice(0, 3).map((a, i) => (
                  <div key={i} className="flex items-start gap-2 text-[11px]">
                    <Lightbulb className="w-3 h-3 text-amber-400 flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{a}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Consultant Notes */}
      <div className="max-w-2xl">
        <div className="bg-card border border-border rounded-[14px] p-5">
          <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase font-mono mb-3">Consultant Notes</p>
          {data?.notes && data.notes.length > 0 && (
            <div className="space-y-1.5 mb-3 pb-3 border-b border-border">
              {data.notes.map((note) => (
                <div key={note.id} className="text-xs text-foreground leading-relaxed bg-muted/50 rounded-lg px-3 py-2">{note.noteText}</div>
              ))}
            </div>
          )}
          <textarea
            value={notes}
            onChange={(e) => { setNotes(e.target.value); setNotesSaved(false); }}
            rows={2}
            placeholder="Add a note…"
            className="w-full bg-input-background border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none leading-relaxed"
          />
          <div className="flex items-center justify-between mt-2.5">
            <span className="text-[10px] text-muted-foreground font-mono">{notes.length > 0 ? `${notes.length} chars` : ""}</span>
            <button
              onClick={async () => {
                if (!notes.trim()) return;
                setNotesSaving(true);
                try {
                  await addConsultantNote(sessionId, notes.trim());
                  setNotes(""); setNotesSaved(true); refetch();
                } catch (e) { console.error(e);
                } finally { setNotesSaving(false); }
              }}
              disabled={!notes.trim() || notesSaving}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
                notesSaved ? "bg-emerald-50 text-emerald-700" : notes.trim() && !notesSaving ? "bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer" : "bg-muted text-muted-foreground cursor-not-allowed"
              }`}
            >
              {notesSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : notesSaved ? <CheckCircle2 className="w-3 h-3" /> : <Save className="w-3 h-3" />}
              {notesSaved ? "Saved" : notesSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center p-8"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>}>
      <ResultsInner />
    </Suspense>
  );
}
