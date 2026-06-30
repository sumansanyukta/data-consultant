"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronRight,
  ArrowRight,
  AlertCircle,
  Flag,
  Info,
  MessageSquare,
  Lightbulb,
  Loader2,
} from "lucide-react";
import { useSessionDetail } from "@/lib/supabase/hooks";

const badgeStyles = {
  danger: "bg-red-50 text-red-700",
  warning: "bg-amber-50 text-amber-700",
  info: "bg-muted text-muted-foreground",
  accent: "bg-accent text-accent-foreground",
  muted: "bg-muted text-muted-foreground",
  success: "bg-emerald-50 text-emerald-700",
};

function Badge({ children, variant = "muted" }: { children: React.ReactNode; variant?: keyof typeof badgeStyles }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full font-mono tracking-wide ${badgeStyles[variant]}`}>
      {children}
    </span>
  );
}

function ResultsInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId") ?? "";
  const { data, loading } = useSessionDetail(sessionId);
  const [notes, setNotes] = useState("");
  const [openFlag, setOpenFlag] = useState<number | null>(null);

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

  const analysisType = input?.businessGoal ?? "Diagnostic";
  const signals = output.keySignals ?? [];
  const flags = output.dataQualityFlags ?? [];
  const analyses = output.recommendedAnalyses ?? [];
  const followUps = output.followUpQuestions ?? [];
  const assumptionsList = output.assumptions ?? [];

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-7">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2 font-mono">
            <span>{session.title}</span>
          </div>
          <h1 className="text-2xl font-semibold text-foreground" style={{ fontFamily: "var(--font-lora), serif" }}>
            Results Workspace
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-medium text-foreground">Confidence</span>
            <span className="text-xs font-mono font-semibold text-primary ml-1">{output.confidenceScore}%</span>
          </div>
          <button
            onClick={() => router.push("/finalize")}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Finalise Session
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-[14px] p-4 mb-5 flex items-center gap-5">
        <div className="flex-1">
          <div className="flex justify-between text-[11px] font-mono text-muted-foreground mb-1.5">
            <span>Overall confidence</span>
            <span>{output.confidenceScore} / 100</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${output.confidenceScore >= 75 ? "bg-emerald-500" : output.confidenceScore >= 55 ? "bg-amber-500" : "bg-red-400"}`} style={{ width: `${output.confidenceScore}%` }} />
          </div>
        </div>
        <div className="w-px h-8 bg-border" />
        <div className="flex-1">
          <div className="flex justify-between text-[11px] font-mono text-muted-foreground mb-1.5">
            <span>Data completeness</span>
            <span>{output.dataCompleteness}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${output.dataCompleteness >= 75 ? "bg-emerald-500" : output.dataCompleteness >= 55 ? "bg-amber-500" : "bg-red-400"}`} style={{ width: `${output.dataCompleteness}%` }} />
          </div>
        </div>
        <div className="w-px h-8 bg-border" />
        <div className="text-center px-2">
          <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider mb-1">Analysis type</p>
          <Badge variant="accent">{analysisType}</Badge>
        </div>
        <div className="text-center px-2">
          <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider mb-1">Data flags</p>
          <Badge variant={flags.length > 0 ? "warning" : "success"}>{flags.length > 0 ? `${flags.length} issues` : "None"}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-5">
        <div className="col-span-3 space-y-5">
          <div className="bg-card border border-border rounded-[14px] p-6">
            <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase font-mono mb-3">Executive Summary</p>
            <p className="text-sm leading-relaxed text-foreground mb-4">{output.execSummary}</p>
          </div>

          {signals.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase font-mono mb-3">Key Signals</p>
              <div className="bg-card border border-border rounded-[14px] p-5 space-y-2">
                {signals.map((s, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-sm text-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-2" />
                    <p className="text-xs leading-relaxed">{s}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {analyses.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase font-mono mb-3">Suggested Analyses</p>
              <div className="space-y-3">
                {analyses.map((a, i) => (
                  <div key={i} className="bg-card border border-border rounded-[14px] p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-6 h-6 rounded-lg bg-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[11px] font-mono font-semibold text-primary">{String(i + 1).padStart(2, "0")}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-1.5">
                          <h4 className="text-sm font-semibold text-foreground">{a.title}</h4>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <div className="w-14 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${a.confidence}%` }} />
                            </div>
                            <span className="text-[10px] font-mono text-muted-foreground">{a.confidence}%</span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed mb-2">{a.desc}</p>
                        <div className="flex gap-1.5">
                          {a.tags.map((t) => (<Badge key={t} variant="muted">{t}</Badge>))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-card border border-border rounded-[14px] p-6">
            <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase font-mono mb-3">Consultant Notes</p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Add your own context, caveats, or observations here..."
              className="w-full bg-input-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none leading-relaxed"
            />
          </div>
        </div>

        <div className="col-span-2 space-y-5">
          <div className="bg-card border border-border rounded-[14px] p-5">
            <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase font-mono mb-3">Data Quality Flags</p>
            <div className="space-y-2">
              {flags.length === 0 && <p className="text-xs text-muted-foreground">No flags detected.</p>}
              {flags.map((f, i) => (
                <div key={i}>
                  <button onClick={() => setOpenFlag(openFlag === i ? null : i)} className="w-full flex items-start gap-2.5 text-left">
                    {f.severity === "danger" ? <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" /> : f.severity === "warning" ? <Flag className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" /> : <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <code className="text-[11px] font-mono bg-muted px-1.5 py-0.5 rounded text-foreground">{f.field}</code>
                        <Badge variant={f.severity === "danger" ? "danger" : f.severity === "warning" ? "warning" : "muted"}>{f.severity}</Badge>
                      </div>
                      {openFlag === i && <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{f.issue}</p>}
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {followUps.length > 0 && (
            <div className="bg-card border border-border rounded-[14px] p-5">
              <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase font-mono mb-3">Follow-up Questions</p>
              <div className="space-y-2.5">
                {followUps.map((q, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <MessageSquare className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-foreground leading-relaxed">{q}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {assumptionsList.length > 0 && (
            <div className="bg-card border border-border rounded-[14px] p-5">
              <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase font-mono mb-3">Assumptions Made</p>
              <div className="space-y-2.5">
                {assumptionsList.map((a, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-foreground leading-relaxed">{a}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    }>
      <ResultsInner />
    </Suspense>
  );
}
