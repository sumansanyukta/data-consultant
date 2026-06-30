"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ArrowRight, Loader2 } from "lucide-react";
import { useClients } from "@/lib/supabase/hooks";
import { createSession } from "@/lib/supabase/queries";

const types = ["Descriptive", "Diagnostic", "Predictive", "Prescriptive"];

export default function NewSessionPage() {
  const router = useRouter();
  const { data: clients } = useClients();
  const [clientMode, setClientMode] = useState<"existing" | "new">("existing");
  const [selectedClient, setSelectedClient] = useState("");
  const [title, setTitle] = useState("");
  const [analysisType, setAnalysisType] = useState<string[]>(["Descriptive"]);
  const [creating, setCreating] = useState(false);

  const toggleType = (t: string) =>
    setAnalysisType((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );

  const client = clients?.find((c) => c.id === selectedClient);

  return (
    <div className="p-8">
      <div className="mb-7">
        <h1
          className="text-2xl font-semibold text-foreground"
          style={{ fontFamily: "var(--font-lora), serif" }}
        >
          New Analysis Session
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure the session before importing your client brief.
        </p>
      </div>

      <div className="grid grid-cols-5 gap-6">
        {/* Form */}
        <div className="col-span-3 space-y-5">
          {/* Client selector */}
          <div className="bg-card border border-border rounded-[14px] p-6">
            <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase font-mono mb-3">
              Client
            </p>
            <div className="flex gap-2 mb-4">
              {(["existing", "new"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setClientMode(m)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    clientMode === m
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {m === "existing" ? "Existing client" : "Create new"}
                </button>
              ))}
            </div>

            {clientMode === "existing" ? (
              <div className="relative">
                <select
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  className="w-full appearance-none bg-input-background border border-border rounded-xl px-4 py-3 text-sm text-foreground pr-9 focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select a client</option>
                  {(clients ?? []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — {c.sector}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  placeholder="Company name"
                  className="w-full bg-input-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <input
                  placeholder="Sector (e.g. Financial Services)"
                  className="w-full bg-input-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            )}
          </div>

          {/* Session details */}
          <div className="bg-card border border-border rounded-[14px] p-6">
            <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase font-mono mb-3">
              Session Details
            </p>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">
                  Session title
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Q2 Churn Attribution — Retail Segment"
                  className="w-full bg-input-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">
                  Lead consultant
                </label>
                <div className="relative">
                  <select className="w-full appearance-none bg-input-background border border-border rounded-xl px-4 py-3 text-sm text-foreground pr-9 focus:outline-none focus:ring-2 focus:ring-ring">
                    <option>Lena Fischer — Senior Consultant</option>
                    <option>Max Brauer — Consultant</option>
                    <option>Sophia Kern — Lead Analyst</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-2">
                  Analysis type
                </label>
                <div className="flex flex-wrap gap-2">
                  {types.map((t) => (
                    <button
                      key={t}
                      onClick={() => toggleType(t)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        analysisType.includes(t)
                          ? "bg-accent border-primary/30 text-accent-foreground"
                          : "bg-muted border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={async () => {
              if (!selectedClient || !title) return;
              setCreating(true);
              try {
                const session = await createSession({
                  clientId: selectedClient,
                  title,
                  consultant: "Lena Fischer",
                  analysisType,
                });
                router.push(`/intake?sessionId=${session.id}`);
              } catch (e) {
                console.error("Failed to create session", e);
                setCreating(false);
              }
            }}
            disabled={!selectedClient || !title || creating}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-colors shadow-sm ${
              selectedClient && title && !creating
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}
          >
            {creating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Continue to Brief & Data
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Info panel */}
        <div className="col-span-2 space-y-4">
          <div className="bg-card border border-border rounded-[14px] p-5 bg-muted/40">
            <p className="text-[11px] font-mono font-semibold tracking-widest uppercase text-muted-foreground mb-3">
              What happens next
            </p>
            <div className="space-y-3">
              {[
                { step: "01", label: "Paste brief", desc: "Add your client's written brief — raw or formatted." },
                { step: "02", label: "Upload data", desc: "Optional CSV or tabular sample for quantitative grounding." },
                { step: "03", label: "Define goal", desc: "Specify the analytical question you're trying to answer." },
                { step: "04", label: "Run analysis", desc: "The AI pipeline structures your starting point." },
              ].map(({ step, label, desc }) => (
                <div key={step} className="flex gap-3">
                  <span className="text-[11px] font-mono font-semibold text-muted-foreground/60 w-5 flex-shrink-0 pt-0.5">
                    {step}
                  </span>
                  <div>
                    <p className="text-xs font-medium text-foreground">{label}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {client && (
            <div className="bg-card border border-border rounded-[14px] p-5">
              <p className="text-[11px] font-mono font-semibold tracking-widest uppercase text-muted-foreground mb-3">
                Client context
              </p>
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">{client.name}</p>
                <p className="text-xs text-muted-foreground">{client.sector}</p>
                <div className="flex gap-3 pt-1">
                  <div className="text-center">
                    <p className="text-lg font-semibold text-foreground">{client.sessions}</p>
                    <p className="text-[10px] text-muted-foreground font-mono uppercase">Sessions</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-foreground">{client.lastActive}</p>
                    <p className="text-[10px] text-muted-foreground font-mono uppercase">Last active</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
