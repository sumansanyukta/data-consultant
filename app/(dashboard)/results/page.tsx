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
  ShieldCheck,
  ScanLine,
  Table2,
  Rows3,
  AlertTriangle,
} from "lucide-react";
import { useSessionDetail } from "@/lib/supabase/hooks";
import { addConsultantNote } from "@/lib/supabase/queries";
import { NullBarChart } from "@/components/charts/null-bar-chart";
import { ColumnTypeChart } from "@/components/charts/column-type-chart";
import { SeverityChart } from "@/components/charts/severity-chart";
import { CorrelationHeatmap } from "@/components/charts/correlation-heatmap";
import { DistributionChart } from "@/components/charts/distribution-chart";
import { TopValuesChart } from "@/components/charts/top-values-chart";
import { CollapsibleSection } from "@/components/collapsible-section";

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
  const stats = output.statSummary;

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
    <div className="p-8 max-w-4xl mx-auto">
      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-6">
        <div className="min-w-0">
          <p className="text-[11px] font-mono text-muted-foreground mb-1 truncate">{session.title}</p>
          <h1
            className="text-xl font-semibold text-foreground"
            style={{ fontFamily: "var(--font-lora), serif" }}
          >
            Results
          </h1>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
          <button
            onClick={downloadReport}
            className="flex items-center gap-1.5 bg-card border border-border text-foreground px-3 py-2 rounded-xl text-xs font-medium hover:bg-muted transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
          <button
            onClick={() => router.push(`/next-steps?sessionId=${sessionId}`)}
            className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-2 rounded-xl text-xs font-medium hover:bg-primary/90 transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
          >
            View tasks
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Hero stat strip ── */}
      <div className="grid grid-cols-5 gap-3 mb-8">
        {[
          { label: "Confidence", value: `${output.confidenceScore}%`, icon: ShieldCheck, gradient: "from-emerald-50/80 to-emerald-50/20", border: "border-emerald-200/50", iconColor: "text-emerald-600" },
          { label: "Completeness", value: `${output.dataCompleteness}%`, icon: ScanLine, gradient: "from-primary/5 to-primary/[0.02]", border: "border-border", iconColor: "text-primary" },
          { label: "Columns", value: String(colCount), icon: Table2, gradient: "from-accent/60 to-accent/20", border: "border-border", iconColor: "text-primary" },
          { label: "Rows", value: rowCount.toLocaleString(), icon: Rows3, gradient: "from-muted/60 to-muted/20", border: "border-border", iconColor: "text-muted-foreground" },
          { label: "Flags", value: String(flags.length), icon: AlertTriangle, gradient: flags.length > 0 ? "from-amber-50/80 to-amber-50/20" : "from-muted/60 to-muted/20", border: flags.length > 0 ? "border-amber-200/50" : "border-border", iconColor: flags.length > 0 ? "text-amber-600" : "text-muted-foreground" },
        ].map(({ label, value, icon: Icon, gradient, border, iconColor }) => (
          <div key={label} className={`bg-card border ${border} rounded-[14px] p-4 shadow-sm hover:shadow-md transition-all`}>
            <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${gradient} border border-border/50 flex items-center justify-center mb-2.5`}>
              <Icon className={`w-4 h-4 ${iconColor}`} />
            </div>
            <p className="text-xl font-semibold text-foreground tracking-tight">{value}</p>
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Collapsible sections ── */}
      <div className="space-y-3">
        {/* Overview — default open */}
        <CollapsibleSection title="Overview" defaultOpen>
          {output.execSummary && (
            <p className="text-sm text-foreground leading-[1.75] mb-5">
              {output.execSummary}
            </p>
          )}
          {signals.length > 0 && (
            <div>
              <p className="text-[11px] font-mono font-semibold tracking-widest text-muted-foreground uppercase mb-2.5">Key Signals</p>
              <div className="flex flex-wrap gap-2">
                {signals.map((s: string, i: number) => (
                  <span key={i} className="text-xs bg-accent text-accent-foreground px-3 py-1.5 rounded-lg font-medium shadow-sm">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </CollapsibleSection>

        {/* Data Profile */}
        <CollapsibleSection title="Data Profile" count={typeData.length + severityData.length}>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <p className="text-[11px] font-mono font-semibold tracking-widest text-muted-foreground uppercase mb-2.5">Column Health — Null Rate</p>
              <div className="bg-muted/30 rounded-xl p-4 border border-border/50">
                <NullBarChart data={nullData} />
              </div>
            </div>
            <div className="space-y-5">
              <div>
                <p className="text-[11px] font-mono font-semibold tracking-widest text-muted-foreground uppercase mb-2.5">Column Types</p>
                <div className="bg-muted/30 rounded-xl p-4 border border-border/50">
                  <ColumnTypeChart data={typeData} />
                </div>
              </div>
              <div>
                <p className="text-[11px] font-mono font-semibold tracking-widest text-muted-foreground uppercase mb-2.5">Quality Flags</p>
                <div className="bg-muted/30 rounded-xl p-4 border border-border/50">
                  <SeverityChart data={severityData} total={flags.length} />
                </div>
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* Statistics */}
        {stats && (
          <CollapsibleSection title="Statistics" count={[
            stats.correlations?.length ?? 0,
            stats.distributions?.length ?? 0,
            stats.topValues?.length ?? 0,
            stats.outliers?.length ?? 0,
          ].reduce((a, b) => a + b, 0)}>
            <div className="space-y-5">
              {stats.correlations?.length > 0 && (
                <div>
                  <p className="text-[11px] font-mono font-semibold tracking-widest text-muted-foreground uppercase mb-2.5">Correlations</p>
                  <div className="bg-muted/30 rounded-xl p-4 border border-border/50">
                    <CorrelationHeatmap data={stats.correlations} allColumns={columns} />
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-5">
                {stats.distributions?.length > 0 && (
                  <div>
                    <p className="text-[11px] font-mono font-semibold tracking-widest text-muted-foreground uppercase mb-2.5">Distributions</p>
                    <div className="bg-muted/30 rounded-xl p-4 border border-border/50">
                      <DistributionChart data={stats.distributions} />
                    </div>
                  </div>
                )}
                {stats.topValues?.length > 0 && (
                  <div>
                    <p className="text-[11px] font-mono font-semibold tracking-widest text-muted-foreground uppercase mb-2.5">Top Values</p>
                    <div className="bg-muted/30 rounded-xl p-4 border border-border/50">
                      <TopValuesChart data={stats.topValues} />
                    </div>
                  </div>
                )}
              </div>
              {stats.outliers?.length > 0 && (
                <div>
                  <p className="text-[11px] font-mono font-semibold tracking-widest text-muted-foreground uppercase mb-2.5">Outliers</p>
                  <div className="bg-muted/30 rounded-xl p-4 border border-border/50 space-y-1.5">
                    {stats.outliers.slice(0, 8).map((o: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-xs font-mono">
                        <span className="text-muted-foreground w-24 truncate">{o.col}</span>
                        <span className="text-amber-600 font-semibold">{o.value}</span>
                        <span className="text-muted-foreground">row {o.row + 2}</span>
                      </div>
                    ))}
                    {stats.outliers.length > 8 && (
                      <p className="text-[10px] text-muted-foreground font-mono">+{stats.outliers.length - 8} more</p>
                    )}
                  </div>
                </div>
              )}
              {stats.correlations?.length > 0 && (
                <div>
                  <p className="text-[11px] font-mono font-semibold tracking-widest text-muted-foreground uppercase mb-2.5">Relationships</p>
                  <div className="grid grid-cols-2 gap-2">
                    {stats.correlations.slice(0, 6).map((pair: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-xs font-mono bg-muted/30 rounded-xl px-3 py-2 border border-border/50">
                        <div className={`w-2 h-2 rounded-full ${pair.r > 0 ? "bg-emerald-500" : "bg-rose-500"}`} />
                        <span className="text-foreground">{pair.colA}</span>
                        <span className="text-muted-foreground">×</span>
                        <span className="text-foreground">{pair.colB}</span>
                        <span className={`ml-auto font-semibold ${pair.r > 0.5 ? "text-emerald-600" : pair.r < -0.5 ? "text-rose-600" : "text-muted-foreground"}`}>{pair.r}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CollapsibleSection>
        )}

        {/* Recommendations */}
        {(analyses.length > 0 || flags.length > 0 || output.followUpQuestions?.length > 0 || output.assumptions?.length > 0 || (output.suggestedKpis && output.suggestedKpis.length > 0)) && (
          <CollapsibleSection title="Recommendations" count={analyses.length + flags.length}>
            <div className="space-y-5">
              {analyses.length > 0 && (
                <div>
                  <p className="text-[11px] font-mono font-semibold tracking-widest text-muted-foreground uppercase mb-2.5">Recommended Analyses</p>
                  <div className="space-y-2.5">
                    {analyses.slice(0, 3).map((a: any, i: number) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border/50 shadow-sm">
                        <div className="w-5 h-5 rounded-lg bg-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-[10px] font-mono font-semibold text-primary">{i + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-foreground truncate">{a.title}</span>
                            <span className="text-[10px] font-mono text-muted-foreground">{a.confidence}%</span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{a.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {output.suggestedKpis && output.suggestedKpis.length > 0 && (
                <div>
                  <p className="text-[11px] font-mono font-semibold tracking-widest text-muted-foreground uppercase mb-2.5">KPIs</p>
                  <div className="grid grid-cols-2 gap-3">
                    {output.suggestedKpis.map((kpi: any, i: number) => (
                      <div key={i} className={`rounded-xl p-4 border shadow-sm ${
                        kpi.priority === "high" ? "bg-emerald-50/30 border-emerald-200/60" : kpi.priority === "medium" ? "bg-amber-50/30 border-amber-200/60" : "bg-muted/20 border-border/50"
                      }`}>
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <span className="text-xs font-semibold text-foreground">{kpi.name}</span>
                          <span className={`text-[10px] font-mono uppercase tracking-wider font-semibold ${
                            kpi.priority === "high" ? "text-emerald-700" : kpi.priority === "medium" ? "text-amber-700" : "text-muted-foreground"
                          }`}>{kpi.priority}</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed mb-2">{kpi.description}</p>
                        <code className="block text-[10px] font-mono bg-card border border-border/50 rounded-md px-2.5 py-1.5 text-foreground/80">{kpi.formula}</code>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {flags.length > 0 && (
                <div>
                  <p className="text-[11px] font-mono font-semibold tracking-widest text-muted-foreground uppercase mb-2.5">Quality Flags</p>
                  <div className="space-y-2">
                    {flags.map((f: any, i: number) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs bg-muted/30 rounded-xl px-3 py-2.5 border border-border/50">
                        {f.severity === "danger" ? <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" /> : f.severity === "warning" ? <Flag className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" /> : <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />}
                        <div>
                          <code className="text-[10px] font-mono bg-card px-1.5 py-0.5 rounded text-foreground border border-border/50">{f.field}</code>
                          <p className="text-muted-foreground mt-0.5">{f.issue}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {output.followUpQuestions && output.followUpQuestions.length > 0 && (
                <div>
                  <p className="text-[11px] font-mono font-semibold tracking-widest text-muted-foreground uppercase mb-2.5">Questions</p>
                  <div className="space-y-2">
                    {output.followUpQuestions.slice(0, 3).map((q: string, i: number) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs bg-muted/30 rounded-xl px-3 py-2.5 border border-border/50">
                        <MessageSquare className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{q}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {output.assumptions && output.assumptions.length > 0 && (
                <div>
                  <p className="text-[11px] font-mono font-semibold tracking-widest text-muted-foreground uppercase mb-2.5">Assumptions</p>
                  <div className="space-y-2">
                    {output.assumptions.slice(0, 3).map((a: string, i: number) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs bg-muted/30 rounded-xl px-3 py-2.5 border border-border/50">
                        <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{a}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CollapsibleSection>
        )}

        {/* Notes */}
        <CollapsibleSection title="Notes" count={data?.notes?.length}>
          {data?.notes && data.notes.length > 0 && (
            <div className="space-y-2 mb-4 pb-4 border-b border-border/50">
              {data.notes.map((note) => (
                <div key={note.id} className="text-sm text-foreground leading-relaxed bg-muted/30 rounded-xl px-4 py-3 border border-border/50">{note.noteText}</div>
              ))}
            </div>
          )}
          <textarea
            value={notes}
            onChange={(e) => { setNotes(e.target.value); setNotesSaved(false); }}
            rows={2}
            placeholder="Add a note…"
            className="w-full bg-input-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none leading-relaxed"
          />
          <div className="flex items-center justify-between mt-3">
            <span />
            <button
              onClick={async () => {
                if (!notes.trim()) return;
                setNotesSaving(true);
                try {
                  await addConsultantNote(sessionId, notes.trim());
                  setNotes(""); setNotesSaved(true); refetch();
                } catch { console.error();
                } finally { setNotesSaving(false); }
              }}
              disabled={!notes.trim() || notesSaving}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all active:scale-[0.98] ${
                notesSaved ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50" : notes.trim() && !notesSaving ? "bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-sm" : "bg-muted text-muted-foreground cursor-not-allowed"
              }`}
            >
              {notesSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : notesSaved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              {notesSaved ? "Saved" : notesSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </CollapsibleSection>
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
