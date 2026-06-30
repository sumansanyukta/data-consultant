"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Save, Loader2 } from "lucide-react";
import { useSessionDetail } from "@/lib/supabase/hooks";

const nextSteps = [
  { id: "workshop", label: "Schedule stakeholder workshop" },
  { id: "data-sprint", label: "Initiate data quality sprint" },
  { id: "report", label: "Draft formal report" },
  { id: "hold", label: "On hold — awaiting client input" },
];

function FinalizeInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId") ?? "";
  const { data, loading } = useSessionDetail(sessionId);
  const [nextStep, setNextStep] = useState("workshop");
  const [recommendation, setRecommendation] = useState("");
  const [saved, setSaved] = useState(false);

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

  if (!session || !output) {
    return (
      <div className="p-8">
        <p className="text-sm text-muted-foreground">No session data found.</p>
      </div>
    );
  }

  const dataFile = input?.dataFiles?.[0];
  const fileName = dataFile?.fileName ?? "Unknown file";

  const summary = [
    ["Client", client?.name ?? "Unknown"],
    ["Session", session.title],
    ["Consultant", session.consultant],
    ["Date", session.date],
    ["Objective", input?.businessGoal ?? "Diagnostic"],
    ["Data uploaded", fileName],
  ];

  const metrics = [
    { label: "Confidence score", value: `${output.confidenceScore}%`, ok: output.confidenceScore >= 65 },
    { label: "Data completeness", value: `${output.dataCompleteness}%`, ok: output.dataCompleteness >= 70 },
    { label: "Suggested analyses", value: String(output.recommendedAnalyses.length), ok: output.recommendedAnalyses.length > 0 },
    { label: "Data quality flags", value: String(output.dataQualityFlags.length), ok: output.dataQualityFlags.length === 0 },
    { label: "Follow-up questions", value: String(output.followUpQuestions.length), ok: true },
  ];

  return (
    <div className="p-8">
      <div className="mb-7">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2 font-mono">
          <span>{client?.name ?? "Client"}</span>
          <span className="text-muted-foreground/50 mx-1">/</span>
          <span className="text-foreground">{session.title}</span>
        </div>
        <h1
          className="text-2xl font-semibold text-foreground"
          style={{ fontFamily: "var(--font-lora), serif" }}
        >
          Finalise Session
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review outputs, write a recommendation, and save to client history.
        </p>
      </div>

      <div className="grid grid-cols-5 gap-6">
        <div className="col-span-3 space-y-5">
          <div className="bg-card border border-border rounded-[14px] p-6">
            <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase font-mono mb-3">
              Consultant Recommendation
            </p>
            <textarea
              value={recommendation}
              onChange={(e) => setRecommendation(e.target.value)}
              rows={7}
              placeholder="Write your recommendation for the next steps..."
              className="w-full bg-input-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none leading-relaxed"
            />
          </div>

          <div className="bg-card border border-border rounded-[14px] p-6">
            <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase font-mono mb-3">
              Next Step
            </p>
            <div className="space-y-2">
              {nextSteps.map((ns) => (
                <button
                  key={ns.id}
                  onClick={() => setNextStep(ns.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left text-sm transition-all ${
                    nextStep === ns.id
                      ? "border-primary/40 bg-accent text-foreground"
                      : "border-border bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      nextStep === ns.id
                        ? "border-primary bg-primary"
                        : "border-border"
                    }`}
                  >
                    {nextStep === ns.id && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>
                  {ns.label}
                </button>
              ))}
            </div>
          </div>

          {saved ? (
            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-4">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-emerald-800">
                  Session saved to client history
                </p>
                <p className="text-xs text-emerald-600 mt-0.5">
                  {client?.name ?? "Client"} · {session.title} · {session.date}
                </p>
              </div>
              <button
                onClick={() => router.push("/history")}
                className="ml-auto text-xs font-medium text-emerald-700 hover:underline"
              >
                View in history →
              </button>
            </div>
          ) : (
            <button
              onClick={() => setSaved(true)}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
            >
              <Save className="w-4 h-4" />
              Save Session to Client History
            </button>
          )}
        </div>

        <div className="col-span-2 space-y-4">
          <div className="bg-card border border-border rounded-[14px] p-5 bg-muted/40">
            <p className="text-[11px] font-mono font-semibold tracking-widest uppercase text-muted-foreground mb-3">
              Session Summary
            </p>
            <div className="space-y-3 text-xs">
              {summary.map(([k, v]) => (
                <div key={k} className="flex gap-3">
                  <span className="text-muted-foreground font-mono w-24 flex-shrink-0">
                    {k}
                  </span>
                  <span className="text-foreground">{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border rounded-[14px] p-5">
            <p className="text-[11px] font-mono font-semibold tracking-widest text-muted-foreground uppercase mb-3">
              Output Metrics
            </p>
            <div className="space-y-3">
              {metrics.map(({ label, value, ok }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${
                        ok ? "bg-emerald-500" : "bg-amber-400"
                      }`}
                    />
                    <span className="text-xs font-mono font-semibold text-foreground">
                      {value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FinalizePage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    }>
      <FinalizeInner />
    </Suspense>
  );
}
