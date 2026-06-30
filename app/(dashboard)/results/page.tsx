"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  ArrowRight,
  AlertCircle,
  Flag,
  Info,
  MessageSquare,
  Lightbulb,
} from "lucide-react";

const qualityFlags = [
  {
    sev: "warning" as const,
    field: "ticket_type",
    issue:
      "38% null values — likely legacy card transactions not tagged in new system.",
  },
  {
    sev: "warning" as const,
    field: "zone",
    issue:
      "Zone B/C boundary records show inconsistent assignment post-July 2023 system migration.",
  },
  {
    sev: "info" as const,
    field: "date",
    issue:
      "3 missing weekdays in January — likely public holiday exclusions. Verify with client.",
  },
  {
    sev: "danger" as const,
    field: "riders",
    issue:
      "Negative values in 12 records. Possible refund-transaction leakage from ticketing API.",
  },
];

const analyses = [
  {
    title: "Route-level ridership trend decomposition",
    confidence: 88,
    desc: "Decompose monthly ridership by route to isolate whether decline is systemic or concentrated on specific corridors. Lichtenberg U-Bahn routes show largest YoY delta in the raw data.",
    tags: ["Time series", "Segmentation"],
  },
  {
    title: "Ticket-type mix shift analysis",
    confidence: 74,
    desc: "Monthly subscription vs. single-ticket ratio has shifted materially since the cycling infrastructure expansion. Analyse whether price-sensitive single-trip users are churning disproportionately.",
    tags: ["Cohort", "Mix analysis"],
  },
  {
    title: "Time-of-day demand pattern comparison",
    confidence: 67,
    desc: "Compare peak vs. off-peak ridership Q1–Q2 2023 vs 2024. A shift away from peak commute times would suggest behavioural change rather than fare sensitivity.",
    tags: ["Descriptive", "Comparison"],
  },
];

const followUps = [
  "Does BVG have customer satisfaction data by route that we can join to the ridership file?",
  "What was the exact timeline for the Lichtenberg cycling lane expansion?",
  "Can we get fare-change history for the same period from the client?",
  "Is there a way to distinguish employer-subsidised monthly pass holders from individual subscribers?",
];

const assumptions = [
  "Ridership data represents boardings, not unique riders.",
  "The ticketing system migration in July 2023 is a likely confound for before/after comparison.",
  "Survey data (referenced in brief) has not been provided — analysis proceeds without it.",
];

const badgeStyles = {
  danger: "bg-red-50 text-red-700",
  warning: "bg-amber-50 text-amber-700",
  info: "bg-muted text-muted-foreground",
  accent: "bg-accent text-accent-foreground",
  muted: "bg-muted text-muted-foreground",
  success: "bg-emerald-50 text-emerald-700",
};

function Badge({
  children,
  variant = "muted",
}: {
  children: React.ReactNode;
  variant?: keyof typeof badgeStyles;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full font-mono tracking-wide ${badgeStyles[variant]}`}
    >
      {children}
    </span>
  );
}

export default function ResultsPage() {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [openFlag, setOpenFlag] = useState<number | null>(null);

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-7">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2 font-mono">
            <span>BVG Berliner Verkehrsbetriebe</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground">
              Ridership Decline Q1–Q2 2024
            </span>
          </div>
          <h1
            className="text-2xl font-semibold text-foreground"
            style={{ fontFamily: "var(--font-lora), serif" }}
          >
            Results Workspace
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-medium text-foreground">
              Confidence
            </span>
            <span className="text-xs font-mono font-semibold text-primary ml-1">
              82%
            </span>
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

      {/* Confidence strip */}
      <div className="bg-card border border-border rounded-[14px] p-4 mb-5 flex items-center gap-5">
        <div className="flex-1">
          <div className="flex justify-between text-[11px] font-mono text-muted-foreground mb-1.5">
            <span>Overall confidence</span>
            <span>82 / 100</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500"
              style={{ width: "82%" }}
            />
          </div>
        </div>
        <div className="w-px h-8 bg-border" />
        <div className="flex-1">
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
        <div className="w-px h-8 bg-border" />
        <div className="text-center px-2">
          <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider mb-1">
            Analysis type
          </p>
          <Badge variant="accent">Diagnostic</Badge>
        </div>
        <div className="text-center px-2">
          <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider mb-1">
            Data flags
          </p>
          <Badge variant="warning">4 issues</Badge>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-5">
        {/* Left: Summary + Analyses */}
        <div className="col-span-3 space-y-5">
          {/* Executive Summary */}
          <div className="bg-card border border-border rounded-[14px] p-6">
            <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase font-mono mb-3">
              Executive Summary
            </p>
            <p className="text-sm leading-relaxed text-foreground mb-4">
              The available data suggests that BVG&apos;s ridership decline is{" "}
              <strong>multi-causal</strong>, with distinct dynamics across route
              types and user segments. Route-level data indicates a{" "}
              <strong>disproportionate decline on Lichtenberg-adjacent
              corridors</strong> coinciding with cycling infrastructure expansion.
              Simultaneously, a shift in the <strong>ticket-type mix toward
              single-ticket purchases</strong> signals that monthly commuters are
              beginning to defect — a structurally more concerning trend than
              occasional-rider loss.
            </p>
            <p className="text-sm leading-relaxed text-foreground">
              The ticketing system migration in July 2023 introduces a confound
              that should be isolated before any before/after comparison is
              communicated to the board. Three high-priority analyses are
              recommended to validate these hypotheses with statistical rigour.
            </p>
          </div>

          {/* Suggested Analyses */}
          <div>
            <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase font-mono mb-3">
              Suggested Analyses
            </p>
            <div className="space-y-3">
              {analyses.map((a, i) => (
                <div
                  key={i}
                  className="bg-card border border-border rounded-[14px] p-5"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-6 h-6 rounded-lg bg-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[11px] font-mono font-semibold text-primary">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-1.5">
                        <h4 className="text-sm font-semibold text-foreground">
                          {a.title}
                        </h4>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <div className="w-14 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${a.confidence}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-mono text-muted-foreground">
                            {a.confidence}%
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                        {a.desc}
                      </p>
                      <div className="flex gap-1.5">
                        {a.tags.map((t) => (
                          <Badge key={t} variant="muted">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Consultant Notes */}
          <div className="bg-card border border-border rounded-[14px] p-6">
            <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase font-mono mb-3">
              Consultant Notes
            </p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Add your own context, caveats, or observations here — these travel with the session record..."
              className="w-full bg-input-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none leading-relaxed"
            />
          </div>
        </div>

        {/* Right: Flags, Questions, Assumptions */}
        <div className="col-span-2 space-y-5">
          {/* Data Quality Flags */}
          <div className="bg-card border border-border rounded-[14px] p-5">
            <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase font-mono mb-3">
              Data Quality Flags
            </p>
            <div className="space-y-2">
              {qualityFlags.map((f, i) => (
                <div key={i}>
                  <button
                    onClick={() => setOpenFlag(openFlag === i ? null : i)}
                    className="w-full flex items-start gap-2.5 text-left"
                  >
                    {f.sev === "danger" ? (
                      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    ) : f.sev === "warning" ? (
                      <Flag className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <code className="text-[11px] font-mono bg-muted px-1.5 py-0.5 rounded text-foreground">
                          {f.field}
                        </code>
                        <Badge
                          variant={
                            f.sev === "danger"
                              ? "danger"
                              : f.sev === "warning"
                              ? "warning"
                              : "muted"
                          }
                        >
                          {f.sev}
                        </Badge>
                      </div>
                      {openFlag === i && (
                        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                          {f.issue}
                        </p>
                      )}
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Follow-up Questions */}
          <div className="bg-card border border-border rounded-[14px] p-5">
            <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase font-mono mb-3">
              Follow-up Questions
            </p>
            <div className="space-y-2.5">
              {followUps.map((q, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <MessageSquare className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-foreground leading-relaxed">{q}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Assumptions */}
          <div className="bg-card border border-border rounded-[14px] p-5">
            <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase font-mono mb-3">
              Assumptions Made
            </p>
            <div className="space-y-2.5">
              {assumptions.map((a, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-foreground leading-relaxed">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
