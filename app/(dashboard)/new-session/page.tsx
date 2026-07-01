"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Plus, Building2 } from "lucide-react";
import { useClients } from "@/lib/supabase/hooks";
import { createSession } from "@/lib/supabase/queries";
import { getSupabase } from "@/lib/supabase/client";

const types = ["Descriptive", "Diagnostic", "Predictive", "Prescriptive"];

export default function NewSessionPage() {
  const router = useRouter();
  const { data: clients, refetch: refetchClients } = useClients();
  const [selectedClient, setSelectedClient] = useState("");
  const [analysisType, setAnalysisType] = useState<string[]>(["Descriptive"]);
  const [creating, setCreating] = useState(false);

  const clientList = useMemo(() => clients ?? [], [clients]);

  const client = clientList.find((c) => c.id === selectedClient);

  const generatedTitle = client
    ? `${client.name} — ${analysisType.join(" & ")} Review`
    : "";

  const canContinue = !!selectedClient;

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
          {/* Client selector — clickable cards */}
          <div className="bg-card border border-border rounded-[14px] p-6">
            <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase font-mono mb-4">
              Client
            </p>
            {clientList.length > 0 ? (
              <div className="grid grid-cols-2 gap-2.5">
                {clientList.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedClient(c.id)}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      selectedClient === c.id
                        ? "border-primary/40 bg-accent"
                        : "border-border bg-muted/30 hover:border-border hover:bg-muted/60"
                    }`}
                  >
                    <p className={`text-xs font-semibold mb-0.5 ${
                      selectedClient === c.id ? "text-accent-foreground" : "text-foreground"
                    }`}>
                      {c.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground">{c.sector}</p>
                  </button>
                ))}
                <button
                  onClick={async () => {
                    setCreating(true);
                    try {
                      const sb = getSupabase();
                      const { data: newClient } = await sb
                        .from("clients")
                        .insert({ name: "New Client", sector: "Unknown" })
                        .select()
                        .single();
                      if (newClient) {
                        setSelectedClient(newClient.id);
                        refetchClients();
                      }
                    } catch (_) {}
                    setCreating(false);
                  }}
                  className="p-3.5 rounded-xl border-2 border-dashed border-border hover:border-primary/40 hover:bg-muted/40 transition-all text-center"
                >
                  <Plus className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
                  <p className="text-[11px] font-medium text-muted-foreground">Quick add</p>
                </button>
              </div>
            ) : (
              <button
                onClick={async () => {
                  setCreating(true);
                  try {
                    const sb = getSupabase();
                    const { data: newClient } = await sb
                      .from("clients")
                      .insert({ name: "Demo Client", sector: "E-Commerce" })
                      .select()
                      .single();
                    if (newClient) {
                      setSelectedClient(newClient.id);
                      refetchClients();
                    }
                  } catch (_) {}
                  setCreating(false);
                }}
                disabled={creating}
                className="w-full p-5 rounded-xl border-2 border-dashed border-border hover:border-primary/40 hover:bg-muted/40 transition-all text-center"
              >
                <Building2 className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground mb-1">Quick start</p>
                <p className="text-xs text-muted-foreground">Create a demo client and begin</p>
              </button>
            )}
          </div>

          {/* Session details */}
          <div className="bg-card border border-border rounded-[14px] p-6">
            <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase font-mono mb-4">
              Session Details
            </p>
            <div className="space-y-4">
              {generatedTitle && (
                <div className="bg-muted/50 rounded-xl px-4 py-3">
                  <p className="text-[11px] text-muted-foreground font-mono mb-0.5">Session title</p>
                  <p className="text-sm font-medium text-foreground">{generatedTitle}</p>
                </div>
              )}
              <div>
                <p className="text-xs font-medium text-foreground mb-2.5">
                  Analysis type
                </p>
                <div className="flex flex-wrap gap-2">
                  {types.map((t) => (
                    <button
                      key={t}
                      onClick={() =>
                        setAnalysisType((prev) =>
                          prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
                        )
                      }
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
            type="button"
            onClick={async () => {
              if (!canContinue) return;
              setCreating(true);
              try {
                const session = await createSession({
                  clientId: selectedClient,
                  title: generatedTitle,
                  consultant: "",
                  analysisType,
                });
                router.push(`/intake?sessionId=${session.id}`);
              } catch (e) {
                console.error("Failed to create session", e);
                setCreating(false);
              }
            }}
            disabled={!canContinue || creating}
            className={`w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-colors shadow-sm ${
              canContinue && !creating
                ? "bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}
          >
            {creating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Continue to Intake
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
                { step: "01", label: "Paste brief", desc: "Set the context with a pre-written brief or a preset." },
                { step: "02", label: "Upload data", desc: "Drop a CSV — or try it with sample data." },
                { step: "03", label: "Set objective", desc: "Choose the type of analysis you need." },
                { step: "04", label: "Run analysis", desc: "The pipeline profiles, stats, and structures your insights." },
              ].map(({ step, label, desc }) => (
                <div key={step} className="flex gap-3">
                  <span className="text-[11px] font-mono font-semibold text-muted-foreground/60 w-5 flex-shrink-0 pt-0.5">{step}</span>
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
              <p className="text-[11px] font-mono font-semibold tracking-widest uppercase text-muted-foreground mb-3">Client context</p>
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
