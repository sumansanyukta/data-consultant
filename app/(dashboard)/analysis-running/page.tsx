"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, Circle, ArrowRight } from "lucide-react";

const ANALYSIS_STAGES = [
  { id: "brief", label: "Parsing client brief", detail: "Extracting intent, entities, and key business questions" },
  { id: "data", label: "Checking data quality", detail: "Profiling columns, detecting nulls, type mismatches, outliers" },
  { id: "context", label: "Extracting business context", detail: "Identifying sector patterns, comparable benchmarks" },
  { id: "hypotheses", label: "Generating hypotheses", detail: "Structuring candidate explanations for the problem" },
  { id: "recommendations", label: "Forming recommendations", detail: "Prioritising analyses by confidence and feasibility" },
];

function AnalysisRunningInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId") ?? "";
  const [stage, setStage] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (stage >= ANALYSIS_STAGES.length) {
      const t = setTimeout(() => setDone(true), 500);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setStage((s) => s + 1), 1400);
    return () => clearTimeout(t);
  }, [stage]);

  const pct = Math.round((stage / ANALYSIS_STAGES.length) * 100);

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          <div className={`w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center transition-all duration-500 ${done ? "bg-emerald-100" : "bg-accent"}`}>
            {done ? <CheckCircle2 className="w-7 h-7 text-emerald-600" /> : <Loader2 className="w-7 h-7 text-primary animate-spin" />}
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-1" style={{ fontFamily: "var(--font-lora), serif" }}>
            {done ? "Analysis complete" : "Running analysis…"}
          </h2>
          <p className="text-sm text-muted-foreground">{done ? "Your structured starting point is ready for review." : "Processing your data…"}</p>
        </div>

        <div className="bg-card border border-border rounded-[14px] p-6 mb-5">
          <div className="mb-5">
            <div className="flex justify-between text-[11px] font-mono text-muted-foreground mb-2">
              <span>Progress</span>
              <span>{pct}%</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-500 ease-out" style={{ width: `${pct}%` }} />
            </div>
          </div>

          <div className="space-y-3">
            {ANALYSIS_STAGES.map((s, i) => {
              const isDone = i < stage;
              const isActive = i === stage && !done;
              const isPending = i > stage;
              return (
                <div key={s.id} className={`flex items-start gap-3 transition-opacity duration-300 ${isPending && !done ? "opacity-40" : ""}`}>
                  <div className="flex-shrink-0 mt-0.5">
                    {isDone || done ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : isActive ? <Loader2 className="w-4 h-4 text-primary animate-spin" /> : <Circle className="w-4 h-4 text-border" />}
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${isDone || done ? "text-foreground" : isActive ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</p>
                    {(isDone || isActive || done) && <p className="text-xs text-muted-foreground mt-0.5">{s.detail}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {done && (
          <button
            onClick={() => router.push(`/results?sessionId=${sessionId}`)}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
          >
            View Results
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export default function AnalysisRunningPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    }>
      <AnalysisRunningInner />
    </Suspense>
  );
}
