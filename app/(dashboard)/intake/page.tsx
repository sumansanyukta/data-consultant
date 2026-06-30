"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  Upload,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";

export default function IntakePage() {
  const router = useRouter();
  const [brief, setBrief] = useState(
    `We've been seeing a consistent decline in active monthly riders since Q4 last year across all our core routes. Management wants to understand what's driving this — whether it's a pricing issue, a service quality issue, or external factors like the new cycling lanes. We have some transaction data from our ticketing system and some aggregate ridership counts by route and time-of-day, but it's messy. We also have some customer satisfaction survey results from last year. The board is asking for a clear picture of root causes and what levers we actually have.\n\nThe main question: why are riders churning, and which levers do we control?`
  );
  const [goal, setGoal] = useState("diagnostic");
  const [uploaded, setUploaded] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const validations = [
    {
      label: "Brief length",
      ok: brief.length > 100,
      msg: brief.length > 100 ? "Sufficient detail detected" : "Add more context",
    },
    {
      label: "Business question",
      ok: brief.toLowerCase().includes("why") || brief.toLowerCase().includes("what"),
      msg: "Key question identified",
    },
    {
      label: "Data sample",
      ok: uploaded,
      msg: uploaded ? "ridership_q1q2_2024.csv uploaded" : "Optional — add for richer analysis",
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-7">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2 font-mono">
          <span>BVG Berliner Verkehrsbetriebe</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground">Ridership Decline Q1–Q2 2024</span>
        </div>
        <h1
          className="text-2xl font-semibold text-foreground"
          style={{ fontFamily: "var(--font-lora), serif" }}
        >
          Brief & Data Intake
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Paste the client brief, upload a data sample, and define your
          analytical objective.
        </p>
      </div>

      <div className="grid grid-cols-5 gap-6">
        {/* Left: Brief + Goal */}
        <div className="col-span-3 space-y-5">
          <div className="bg-card border border-border rounded-[14px] p-6">
            <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase font-mono mb-3">
              Client Brief
            </p>
            <textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              rows={10}
              placeholder="Paste the client's brief here — raw email, meeting notes, or any unstructured description of the problem..."
              className="w-full bg-input-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none leading-relaxed"
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-[11px] text-muted-foreground font-mono">
                {brief.length} chars ·{" "}
                {brief.split(/\s+/).filter(Boolean).length} words
              </p>
              <span
                className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full font-mono tracking-wide ${
                  brief.length > 200
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {brief.length > 200 ? "Good depth" : "Add more"}
              </span>
            </div>
          </div>

          <div className="bg-card border border-border rounded-[14px] p-6">
            <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase font-mono mb-3">
              Analytical Objective
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              What type of analysis does this brief call for?
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { id: "diagnostic", label: "Diagnostic", desc: "Why did X happen?" },
                { id: "descriptive", label: "Descriptive", desc: "What is happening?" },
                { id: "predictive", label: "Predictive", desc: "What will happen?" },
                { id: "prescriptive", label: "Prescriptive", desc: "What should we do?" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setGoal(opt.id)}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    goal === opt.id
                      ? "border-primary/40 bg-accent"
                      : "border-border bg-muted/30 hover:border-border hover:bg-muted/60"
                  }`}
                >
                  <p
                    className={`text-xs font-semibold mb-0.5 ${
                      goal === opt.id ? "text-accent-foreground" : "text-foreground"
                    }`}
                  >
                    {opt.label}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Upload + Validation */}
        <div className="col-span-2 space-y-5">
          <div className="bg-card border border-border rounded-[14px] p-6">
            <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase font-mono mb-3">
              Data Sample
            </p>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                setUploaded(true);
              }}
              onClick={() => setUploaded(true)}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                dragOver
                  ? "border-primary bg-accent"
                  : "border-border hover:border-primary/40 hover:bg-muted/40"
              }`}
            >
              {uploaded ? (
                <div>
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-foreground">
                    ridership_q1q2_2024.csv
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    2,847 rows · 14 columns · 438 KB
                  </p>
                </div>
              ) : (
                <div>
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-medium text-foreground">
                    Drop CSV or Excel file
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    or click to browse · Max 50 MB
                  </p>
                </div>
              )}
            </div>

            {uploaded && (
              <div className="mt-4 space-y-2">
                <p className="text-[11px] font-mono font-semibold tracking-widest uppercase text-muted-foreground">
                  Column preview
                </p>
                <div className="bg-muted/50 rounded-lg p-3 overflow-x-auto">
                  <table className="text-[11px] font-mono w-full">
                    <thead>
                      <tr className="text-muted-foreground">
                        {["route_id", "date", "riders", "zone", "ticket_type"].map(
                          (h) => (
                            <th key={h} className="text-left pr-4 pb-1.5 font-medium">
                              {h}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody className="text-foreground">
                      {[
                        ["U1-001", "2024-01-03", "1,240", "A", "monthly"],
                        ["U1-001", "2024-01-04", "1,183", "A", "single"],
                        ["U2-014", "2024-01-03", "892", "B", "monthly"],
                      ].map((row, i) => (
                        <tr key={i}>
                          {row.map((cell, j) => (
                            <td key={j} className="pr-4 py-0.5 text-foreground/80">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <div className="bg-card border border-border rounded-[14px] p-5">
            <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase font-mono mb-3">
              Intake Validation
            </p>
            <div className="space-y-2.5">
              {validations.map(({ label, ok, msg }) => (
                <div key={label} className="flex items-start gap-2.5">
                  {ok ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="text-xs font-medium text-foreground">{label}</p>
                    <p className="text-[11px] text-muted-foreground">{msg}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => router.push("/analysis-running")}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            Run Analysis
          </button>
        </div>
      </div>
    </div>
  );
}
