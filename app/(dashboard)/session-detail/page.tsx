"use client";

import { useRouter } from "next/navigation";
import {
  ChevronRight,
  ArrowRight,
  BookOpen,
} from "lucide-react";
import { RECENT_SESSIONS } from "@/lib/mock-data";

export default function SessionDetailPage() {
  const router = useRouter();
  const session = RECENT_SESSIONS[0];

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
            <span>{session.clientName}</span>
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
            {session.consultant} · {session.date}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/results")}
            className="flex items-center gap-2 bg-muted text-foreground px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-secondary transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            Reopen in Workspace
          </button>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-6">
        <div className="col-span-3 space-y-5">
          <div className="bg-card border border-border rounded-[14px] p-6">
            <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase font-mono mb-3">
              Session Summary
            </p>
            <p className="text-sm text-foreground leading-relaxed">
              {session.summary}
            </p>
          </div>

          <div className="bg-card border border-border rounded-[14px] p-6">
            <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase font-mono mb-3">
              Original Brief (excerpt)
            </p>
            <blockquote className="text-sm text-muted-foreground leading-relaxed border-l-2 border-primary/30 pl-4 italic">
              &ldquo;We&apos;ve been seeing a consistent decline in active monthly
              riders since Q4 last year across all our core routes. Management
              wants to understand what&apos;s driving this — whether it&apos;s a
              pricing issue, a service quality issue, or external factors like
              the new cycling lanes&hellip;&rdquo;
            </blockquote>
          </div>

          <div className="bg-card border border-border rounded-[14px] p-6">
            <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase font-mono mb-3">
              Consultant Notes
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed italic">
              No notes recorded for this session.
            </p>
          </div>
        </div>

        <div className="col-span-2 space-y-4">
          <div className="bg-card border border-border rounded-[14px] p-5">
            <p className="text-[11px] font-mono font-semibold tracking-widest uppercase text-muted-foreground mb-3">
              Session Metadata
            </p>
            <div className="space-y-3 text-xs">
              {[
                ["Client", session.clientName],
                ["Objective", "Diagnostic"],
                ["Consultant", session.consultant],
                ["Date", session.date],
                [
                  "Status",
                  session.status.charAt(0).toUpperCase() +
                    session.status.slice(1),
                ],
                ["Data", "ridership_q1q2_2024.csv"],
              ].map(([k, v]) => (
                <div key={k} className="flex gap-3">
                  <span className="text-muted-foreground font-mono w-20 flex-shrink-0">
                    {k}
                  </span>
                  <span className="text-foreground">{v}</span>
                </div>
              ))}
            </div>
          </div>

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
                      session.confidence >= 75
                        ? "bg-emerald-500"
                        : session.confidence >= 55
                        ? "bg-amber-500"
                        : "bg-red-400"
                    }`}
                    style={{ width: `${session.confidence}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[11px] font-mono text-muted-foreground mb-1.5">
                  <span>Data completeness</span>
                  <span>61%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-500"
                    style={{ width: "61%" }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-[14px] p-5 bg-muted/40">
            <p className="text-[11px] font-mono font-semibold tracking-widest uppercase text-muted-foreground mb-3">
              Recommended next step
            </p>
            <div className="flex items-start gap-2.5">
              <ArrowRight className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-xs text-foreground leading-relaxed">
                Schedule stakeholder workshop with BVG operations team to
                validate route-level hypotheses before proceeding to formal
                analysis.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
