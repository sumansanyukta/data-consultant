"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Upload, Eye, Plus, Building2, Pencil, Check } from "lucide-react";
import { useClients } from "@/lib/supabase/hooks";
import { createSession } from "@/lib/supabase/queries";
import { getSupabase } from "@/lib/supabase/client";

const types = ["Descriptive", "Diagnostic", "Predictive", "Prescriptive"];

export default function NewSessionPage() {
  const router = useRouter();
  const { data: clients, refetch: refetchClients } = useClients();
  const [mode, setMode] = useState<"choose" | "fresh" | "loading" | "sample-ready">("choose");
  const [selectedClient, setSelectedClient] = useState("");
  const [analysisType, setAnalysisType] = useState<string[]>(["Descriptive"]);
  const [creating, setCreating] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const [sampleSessionId, setSampleSessionId] = useState<string | null>(null);

  const clientList = useMemo(() => clients ?? [], [clients]);
  const client = clientList.find((c) => c.id === selectedClient);

  const generatedTitle = client
    ? `${client.name} — ${analysisType.join(" & ")} Review`
    : "";

  const sessionTitle = customTitle || generatedTitle;

  function handleSample() {
    setMode("loading");
    fetch("/api/session/sample", { method: "POST" })
      .then((r) => r.json())
      .then(({ sessionId }) => {
        setSampleSessionId(sessionId);
        setMode("sample-ready");
      })
      .catch(() => setMode("choose"));
  }

  async function handleStartFresh() {
    if (!selectedClient) return;
    setCreating(true);
    try {
      const session = await createSession({
        clientId: selectedClient,
        title: sessionTitle,
        consultant: "",
        analysisType,
      });
      router.push(`/intake?sessionId=${session.id}`);
    } catch {
      setCreating(false);
    }
  }

  return (
    <div className="p-8 max-w-xl mx-auto">
      {mode === "choose" && (
        <>
          <div className="mb-8 text-center">
            <h1
              className="text-2xl font-semibold text-foreground"
              style={{ fontFamily: "var(--font-lora), serif" }}
            >
              New Analysis Session
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              Upload your own data to analyse, or explore the platform with a sample dataset.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleSample}
              className="bg-card border border-border rounded-[14px] p-6 text-center hover:border-primary/40 hover:bg-muted/40 transition-all group active:scale-[0.98]"
            >
              <Eye className="w-8 h-8 text-primary mx-auto mb-3" />
              <p className="text-sm font-semibold text-foreground mb-1">Try sample data</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Pre-loaded retail dataset — see the full pipeline in action.
              </p>
            </button>

            <button
              onClick={() => {
                if (clientList.length > 0) {
                  setSelectedClient(clientList[0].id);
                }
                setMode("fresh");
              }}
              className="bg-card border border-border rounded-[14px] p-6 text-center hover:border-primary/40 hover:bg-muted/40 transition-all group active:scale-[0.98]"
            >
              <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3 group-hover:text-primary transition-colors" />
              <p className="text-sm font-semibold text-foreground mb-1">Start fresh</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Pick a client, choose analysis type, and upload your own CSV.
              </p>
            </button>
          </div>
        </>
      )}

      {mode === "fresh" && (
        <>
          <button
            onClick={() => setMode("choose")}
            className="text-xs text-muted-foreground hover:text-foreground font-mono mb-6 transition-colors"
          >
            ← Back
          </button>

          <div className="space-y-5">
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
                      className={`p-3 rounded-xl border text-left transition-all active:scale-[0.98] ${
                        selectedClient === c.id
                          ? "border-primary/60 bg-accent ring-1 ring-primary/20"
                          : "border-border bg-muted/30 hover:border-muted-foreground/30 hover:bg-muted/60"
                      }`}
                    >
                      <p className={`text-xs font-semibold ${selectedClient === c.id ? "text-accent-foreground" : "text-foreground"}`}>
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
                      } catch {}
                      setCreating(false);
                    }}
                    className="p-3 rounded-xl border-2 border-dashed border-border hover:border-primary/40 hover:bg-muted/40 transition-all text-center"
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
                    } catch {}
                    setCreating(false);
                  }}
                  className="w-full p-5 rounded-xl border-2 border-dashed border-border hover:border-primary/40 hover:bg-muted/40 transition-all text-center"
                >
                  <Building2 className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-medium text-foreground mb-1">Quick start</p>
                  <p className="text-xs text-muted-foreground">Create a demo client and begin</p>
                </button>
              )}
            </div>

            <div className="bg-card border border-border rounded-[14px] p-6">
              <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase font-mono mb-4">
                Analysis Type
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
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all active:scale-[0.97] ${
                      analysisType.includes(t)
                        ? "bg-accent border-primary/40 text-accent-foreground shadow-sm"
                        : "bg-muted border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              {generatedTitle && (
                <div className="mt-4 bg-muted/50 rounded-xl px-4 py-3">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-[11px] text-muted-foreground font-mono">Session title</p>
                    <button
                      onClick={() => { setEditingTitle(!editingTitle); if (!editingTitle) setCustomTitle(generatedTitle); }}
                      className="text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                    >
                      {editingTitle ? <Check className="w-3 h-3" /> : <Pencil className="w-3 h-3" />}
                      {editingTitle ? "Done" : "Edit"}
                    </button>
                  </div>
                  {editingTitle ? (
                    <input
                      type="text"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      className="w-full bg-card border border-border rounded-lg px-3 py-1.5 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      autoFocus
                    />
                  ) : (
                    <p className="text-sm font-medium text-foreground">{sessionTitle}</p>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={handleStartFresh}
              disabled={!selectedClient || creating}
              className={`w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-colors shadow-sm ${
                selectedClient && !creating
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
        </>
      )}

      {mode === "loading" && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-primary animate-spin mb-4" />
          <p className="text-sm text-muted-foreground">Setting up your sample session…</p>
        </div>
      )}

      {mode === "sample-ready" && (
        <div className="animate-in fade-in duration-300">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-50/80 to-emerald-50/20 border border-emerald-200/50 flex items-center justify-center mx-auto mb-4">
              <Check className="w-6 h-6 text-emerald-600" />
            </div>
            <h1
              className="text-xl font-semibold text-foreground mb-1.5"
              style={{ fontFamily: "var(--font-lora), serif" }}
            >
              Sample data loaded
            </h1>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              A 151-row retail e-commerce dataset is ready. We&apos;ve drafted a brief — review it, then run the analysis.
            </p>
          </div>

          <button
            onClick={() => router.push(`/intake?sessionId=${sampleSessionId}&sample=true&step=3`)}
            className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-xl text-sm font-medium hover:bg-primary/90 transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
          >
            Continue to review
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
