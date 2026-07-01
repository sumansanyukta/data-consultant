"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight } from "lucide-react";

const PHASES = [
  { id: "profile", label: "Profiling data", desc: "Reading columns, types, and structure" },
  { id: "compute", label: "Computing statistics", desc: "Correlations, distributions, outliers" },
  { id: "synthesize", label: "Synthesising insights", desc: "Signals, recommendations, next steps" },
];

function PhaseDot({ state }: { state: "done" | "active" | "pending" }) {
  return (
    <div className="flex items-center gap-3 group">
      <div className="relative w-5 h-5 flex items-center justify-center">
        <div
          className={`absolute inset-0 rounded-full transition-all duration-700 ${
            state === "done"
              ? "bg-primary scale-100"
              : state === "active"
              ? "bg-primary/20 scale-125 animate-ping"
              : "bg-muted scale-100"
          }`}
        />
        <div
          className={`relative w-2 h-2 rounded-full transition-all duration-500 ${
            state === "done" ? "bg-white" : state === "active" ? "bg-primary" : "bg-muted-foreground/30"
          }`}
        />
      </div>
    </div>
  );
}

function AnalysisRunningInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId") ?? "";
  const [phase, setPhase] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (phase >= PHASES.length) {
      const t = setTimeout(() => setDone(true), 600);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setPhase((s) => s + 1), phase === 0 ? 1800 : 1200);
    return () => clearTimeout(t);
  }, [phase]);

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="w-full max-w-sm text-center">
        {/* Icon */}
        <div className="relative w-16 h-16 mx-auto mb-6">
          <div className={`absolute inset-0 rounded-2xl transition-all duration-700 ${
            done ? "bg-emerald-50 scale-100" : "bg-accent scale-100"
          }`} />
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 animate-pulse" style={{ animationDuration: "3s" }} />
          <div className="relative w-full h-full flex items-center justify-center">
            {done ? (
              <svg className="w-7 h-7 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 6L9 17L4 12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <div className="w-6 h-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
            )}
          </div>
        </div>

        {/* Title */}
        <h2
          className="text-xl font-semibold text-foreground mb-2"
          style={{ fontFamily: "var(--font-lora), serif" }}
        >
          {done ? "Analysis ready" : "Processing dataset"}
        </h2>
        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
          {done
            ? "Charts, metrics, and suggested next steps are ready for review."
            : "Running computations in the background."}
        </p>

        {/* Phases */}
        <div className="bg-card border border-border rounded-2xl p-5 mb-6 text-left">
          <div className="space-y-4">
            {PHASES.map((p, i) => {
              const isDone = i < phase || done;
              const isActive = i === phase && !done;
              return (
                <div
                  key={p.id}
                  className={`flex items-center gap-4 transition-opacity duration-500 ${
                    isDone || isActive ? "opacity-100" : "opacity-30"
                  }`}
                >
                  <PhaseDot state={isDone ? "done" : isActive ? "active" : "pending"} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium transition-colors duration-300 ${
                      isDone ? "text-foreground" : isActive ? "text-foreground" : "text-muted-foreground"
                    }`}>
                      {p.label}
                    </p>
                    {(isDone || isActive) && (
                      <p className="text-xs text-muted-foreground mt-0.5">{p.desc}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {done && (
          <button
            onClick={() => router.push(`/results?sessionId=${sessionId}`)}
            className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-xl text-sm font-medium hover:bg-primary/90 transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
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
        <div className="w-6 h-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      </div>
    }>
      <AnalysisRunningInner />
    </Suspense>
  );
}
