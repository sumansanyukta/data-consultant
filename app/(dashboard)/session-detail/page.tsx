"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronRight, ArrowRight, BookOpen, Loader2, AlertCircle, Flag, Info, Database, BarChart3, Shield, Eye } from "lucide-react";
import { useSessionDetail } from "@/lib/supabase/hooks";

function SessionDetailInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId") ?? "";
  const { data, loading } = useSessionDetail(sessionId);

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
  const client = data?.client;

  if (!session) {
    return (
      <div className="p-8">
        <p className="text-sm text-muted-foreground">Session not found.</p>
      </div>
    );
  }

  const dataFile = input?.dataFiles?.[0];
  const fileName = dataFile?.fileName ?? "Unknown";
  const briefText = input?.briefText ?? "";
  const recommendedAnalyses = output?.recommendedAnalyses ?? [];
  const dataCompleteness = output?.dataCompleteness ?? 0;
  const flags = output?.dataQualityFlags ?? [];
  const signals = output?.keySignals ?? [];
  const dtypes = dataFile?.dtypes ?? {};
  const typeCounts: Record<string, number> = {};
  for (const dt of Object.values(dtypes)) typeCounts[dt] = (typeCounts[dt] ?? 0) + 1;
  const typeEntries = Object.entries(typeCounts);
  const rowCount = dataFile?.rowCount ?? 0;
  const colCount = dataFile?.columnCount ?? 0;

  const statCards = [
    { label: "Confidence", value: `${output?.confidenceScore ?? 0}%` },
    { label: "Completeness", value: `${dataCompleteness}%` },
    { label: "Columns", value: String(colCount) },
    { label: "Rows", value: rowCount.toLocaleString() },
    { label: "Flags", value: String(flags.length) },
  ];

  return (
    <div className="p-8">
      <button
        onClick={() => router.push("/history")}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-5 transition-colors font-mono"
      >
        ← Back to history
      </button>

      <div className="flex items-start justify-between mb-7">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2 font-mono">
            <span>{client?.name ?? "Client"}</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground">{session.title}</span>
          </div>
          <h1
            className="text-2xl font-semibold text-foreground"
            style={{ fontFamily: "var(--font-lora), serif" }}
          >
            {session.title}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {session.consultant ? `${session.consultant} · ` : ""}{session.date}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {session.status === "draft" && (
            <span className="text-[10px] font-mono bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-lg uppercase tracking-wider font-semibold">
              Draft
            </span>
          )}
          <button
            onClick={() => router.push(`/results?sessionId=${sessionId}`)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Eye className="w-4 h-4" />
            View Results
          </button>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-5 gap-3 mb-7">
        {statCards.map(({ label, value }) => (
          <div key={label} className="bg-card border border-border rounded-[14px] p-3.5 text-center">
            <p className="text-base font-semibold text-foreground font-mono">{value}</p>
            <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-6">
        <div className="col-span-3 space-y-5">
          {/* Session Summary */}
          <div className="bg-card border border-border rounded-[14px] p-6">
            <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase font-mono mb-3">
              Session Summary
            </p>
            <p className="text-sm text-foreground leading-relaxed">
              {output?.execSummary ?? "No summary available."}
            </p>
          </div>

          {/* Key Signals */}
          {signals.length > 0 && (
            <div className="bg-card border border-border rounded-[14px] p-6">
              <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase font-mono mb-3">
                Key Signals
              </p>
              <div className="flex flex-wrap gap-1.5">
                {signals.map((s: string, i: number) => (
                  <span key={i} className="text-[11px] bg-accent text-accent-foreground px-2.5 py-1 rounded-lg font-medium leading-snug">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Original Brief */}
          {briefText && (
            <div className="bg-card border border-border rounded-[14px] p-6">
              <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase font-mono mb-3">
                Original Brief
              </p>
              <blockquote className="text-sm text-muted-foreground leading-relaxed border-l-2 border-primary/30 pl-4 italic">
                &ldquo;{briefText}&rdquo;
              </blockquote>
            </div>
          )}

          {/* Consultant Notes */}
          <div className="bg-card border border-border rounded-[14px] p-6">
            <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase font-mono mb-3">
              Consultant Notes
            </p>
            {data && data.notes.length > 0 ? (
              <div className="space-y-3">
                {data.notes.map((note) => (
                  <p key={note.id} className="text-sm text-foreground leading-relaxed">{note.noteText}</p>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground leading-relaxed italic">
                No notes recorded for this session.
              </p>
            )}
          </div>
        </div>

        <div className="col-span-2 space-y-4">
          {/* Session Metadata */}
          <div className="bg-card border border-border rounded-[14px] p-5">
            <p className="text-[11px] font-mono font-semibold tracking-widest uppercase text-muted-foreground mb-3">
              Session Metadata
            </p>
            <div className="space-y-2.5 text-xs">
              {[
                ["Client", client?.name ?? "Unknown"],
                ["Objective", input?.businessGoal ?? "Diagnostic"],
                ["Analysis", (session.analysisType ?? []).join(", ") || "Diagnostic"],
                ...(session.consultant ? [["Consultant", session.consultant] as const] : []),
                ["Date", session.date],
                ["Status", session.status.charAt(0).toUpperCase() + session.status.slice(1)],
                ["Data", fileName],
                ...(rowCount ? [["Rows", rowCount.toLocaleString()] as const] : []),
                ...(colCount ? [["Columns", String(colCount)] as const] : []),
              ].map(([k, v]) => (
                <div key={k} className="flex gap-3">
                  <span className="text-muted-foreground font-mono w-20 flex-shrink-0">{k}</span>
                  <span className="text-foreground">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Column Types */}
          {typeEntries.length > 0 && (
            <div className="bg-card border border-border rounded-[14px] p-5">
              <p className="text-[11px] font-mono font-semibold tracking-widest uppercase text-muted-foreground mb-3">
                Column Types
              </p>
              <div className="space-y-2 text-xs">
                {typeEntries.map(([type, count]) => (
                  <div key={type} className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      type === "numeric" ? "bg-[#C4622D]" : type === "text" ? "bg-[#4A7C7C]" : type === "date" ? "bg-[#8B6F9E]" : "bg-[#B0ADAA]"
                    }`} />
                    <span className="font-mono text-muted-foreground">{type}</span>
                    <span className="font-mono text-foreground font-semibold ml-auto">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quality Indicators */}
          <div className="bg-card border border-border rounded-[14px] p-5">
            <p className="text-[11px] font-mono font-semibold tracking-widest uppercase text-muted-foreground mb-3">
              Quality Indicators
            </p>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-[11px] font-mono text-muted-foreground mb-1.5">
                  <span>Confidence</span>
                  <span>{session.confidence}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      session.confidence >= 75 ? "bg-emerald-500" : session.confidence >= 55 ? "bg-amber-500" : "bg-red-400"
                    }`}
                    style={{ width: `${session.confidence}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[11px] font-mono text-muted-foreground mb-1.5">
                  <span>Data completeness</span>
                  <span>{dataCompleteness}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      dataCompleteness >= 75 ? "bg-emerald-500" : dataCompleteness >= 55 ? "bg-amber-500" : "bg-red-400"
                    }`}
                    style={{ width: `${dataCompleteness}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Data Quality Flags */}
          {flags.length > 0 && (
            <div className="bg-card border border-border rounded-[14px] p-5">
              <p className="text-[11px] font-mono font-semibold tracking-widest uppercase text-muted-foreground mb-3">
                Data Quality Flags
              </p>
              <div className="space-y-2">
                {flags.slice(0, 5).map((f: any, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-[11px]">
                    {f.severity === "danger" ? <AlertCircle className="w-3 h-3 text-red-500 flex-shrink-0 mt-0.5" /> :
                     f.severity === "warning" ? <Flag className="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" /> :
                     <Info className="w-3 h-3 text-blue-400 flex-shrink-0 mt-0.5" />}
                    <div>
                      <code className="text-[10px] font-mono bg-muted px-1 py-0.5 rounded text-foreground">{f.field}</code>
                      <p className="text-muted-foreground mt-0.5">{f.issue}</p>
                    </div>
                  </div>
                ))}
                {flags.length > 5 && (
                  <p className="text-[10px] text-muted-foreground font-mono pt-1">+{flags.length - 5} more</p>
                )}
              </div>
            </div>
          )}

          {/* Recommended next step */}
          {recommendedAnalyses.length > 0 && (
            <div className="bg-card border border-border rounded-[14px] p-5 bg-muted/40">
              <p className="text-[11px] font-mono font-semibold tracking-widest uppercase text-muted-foreground mb-3">
                Recommended next step
              </p>
              <div className="flex items-start gap-2.5">
                <ArrowRight className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-xs text-foreground leading-relaxed">
                  {recommendedAnalyses[0].desc}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SessionDetailPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    }>
      <SessionDetailInner />
    </Suspense>
  );
}
