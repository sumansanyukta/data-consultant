"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle2, Circle, Loader2, ArrowRight, Save, AlertCircle,
  User, Users, Trash2, RefreshCw,
} from "lucide-react";
import { useSessionDetail } from "@/lib/supabase/hooks";
import { addConsultantNote, saveSessionOutput, finalizeSession } from "@/lib/supabase/queries";
import type { TaskItem } from "@/types";

function NextStepsInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId") ?? "";
  const { data, loading, refetch } = useSessionDetail(sessionId);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [regenerateError, setRegenerateError] = useState<string | null>(null);

  useEffect(() => {
    if (data?.output?.tasks && data.output.tasks.length > 0) {
      setTasks(data.output.tasks);
    }
  }, [data]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  const session = data?.session;
  const output = data?.output;
  const client = data?.client;

  if (!session || !output) {
    return (
      <div className="p-8">
        <p className="text-sm text-muted-foreground">No session data found.</p>
      </div>
    );
  }

  const clientTasks = tasks.filter((t) => t.type === "client");
  const internalTasks = tasks.filter((t) => t.type === "internal");
  const clientDone = clientTasks.filter((t) => t.done).length;
  const internalDone = internalTasks.filter((t) => t.done).length;

  const toggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t))
    );
  };

  const deleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    setRegenerateError(null);
    try {
      const res = await fetch("/api/pipeline/regenerate-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      if (!res.ok) throw new Error(await res.text());
      const { tasks: newTasks } = await res.json();
      if (newTasks?.length > 0) setTasks(newTasks);
      else setRegenerateError("No tasks were generated. Try again.");
    } catch (e: any) {
      setRegenerateError(e.message ?? "Failed to regenerate tasks");
    } finally {
      setRegenerating(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSessionOutput(sessionId, {
        execSummary: output.execSummary,
        keySignals: output.keySignals,
        dataQualityFlags: output.dataQualityFlags,
        recommendedAnalyses: output.recommendedAnalyses,
        followUpQuestions: output.followUpQuestions,
        assumptions: output.assumptions,
        confidenceScore: output.confidenceScore,
        dataCompleteness: output.dataCompleteness,
        statSummary: output.statSummary ?? null,
        tasks,
      });
      await finalizeSession(sessionId, "complete");
      if (tasks.length > 0) {
        await addConsultantNote(
          sessionId,
          `Next steps saved: ${clientDone + internalDone}/${tasks.length} tasks (${clientDone}/${clientTasks.length} client, ${internalDone}/${internalTasks.length} internal)`
        );
      }
      setSaved(true);
    } catch (e) {
      console.error("Failed to save tasks", e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* ── Header ── */}
      <div className="mb-8">
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-[0.15em] mb-2 font-semibold">
          {client?.name ?? "Client"} · {session.title}
        </p>
        <h1
          className="text-2xl font-semibold text-foreground mb-1.5"
          style={{ fontFamily: "var(--font-lora), serif" }}
        >
          Next Steps
        </h1>
        <p className="text-sm text-muted-foreground max-w-lg">
          AI-generated action items for the client and internal team.
          Toggle completion, remove what doesn&apos;t apply, and save to client history.
        </p>
      </div>

      {/* ── Regenerate overlay ── */}
      {regenerating && (
        <div className="mb-6 bg-accent border border-primary/20 rounded-2xl shadow-sm px-5 py-4 flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-primary animate-spin flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">Regenerating tasks…</p>
            <p className="text-xs text-muted-foreground">Analysing session data to create new action items</p>
          </div>
        </div>
      )}

      {regenerateError && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl px-5 py-3 flex items-center gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs text-red-700">{regenerateError}</p>
          </div>
          <button onClick={() => setRegenerateError(null)} className="text-[11px] text-red-500 hover:underline whitespace-nowrap">Dismiss</button>
        </div>
      )}

      {/* ── Summary bar ── */}
      <div className="flex items-center gap-4 mb-8">
        <div className="flex items-center gap-3 bg-card border border-border rounded-2xl shadow-sm px-5 py-3 flex-1">
          <div className="flex items-center gap-2 min-w-0">
            <User className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="text-xs font-mono font-semibold text-foreground">Client</span>
          </div>
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden max-w-32">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${clientTasks.length > 0 ? (clientDone / clientTasks.length) * 100 : 0}%` }}
            />
          </div>
          <span className="text-xs font-mono text-muted-foreground tabular-nums">{clientDone}/{clientTasks.length}</span>
        </div>

        <div className="flex items-center gap-3 bg-card border border-border rounded-2xl shadow-sm px-5 py-3 flex-1">
          <div className="flex items-center gap-2 min-w-0">
            <Users className="w-4 h-4 text-[#7A9E9E] flex-shrink-0" />
            <span className="text-xs font-mono font-semibold text-foreground">Internal</span>
          </div>
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden max-w-32">
            <div
              className="h-full rounded-full bg-[#7A9E9E] transition-all"
              style={{ width: `${internalTasks.length > 0 ? (internalDone / internalTasks.length) * 100 : 0}%` }}
            />
          </div>
          <span className="text-xs font-mono text-muted-foreground tabular-nums">{internalDone}/{internalTasks.length}</span>
        </div>

        <button
          onClick={handleRegenerate}
          disabled={regenerating}
          className="flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-medium bg-card border border-border shadow-sm hover:shadow-md hover:bg-muted/50 transition-all active:scale-[0.98] disabled:opacity-50 whitespace-nowrap"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? "animate-spin" : ""}`} />
          {regenerating ? "Generating…" : "Regenerate with AI"}
        </button>
      </div>

      {/* ── Task columns ── */}
      <div className="grid grid-cols-2 gap-6 mb-10">
        {/* Client column */}
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-gradient-to-br from-accent/60 to-accent/20 border-b border-border/50 px-5 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-accent border border-border/50 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">For the Client</p>
                  <p className="text-[11px] font-mono text-muted-foreground">{clientDone} of {clientTasks.length} complete</p>
                </div>
              </div>
            </div>
          </div>
          <div className="p-4 space-y-1.5">
            {clientTasks.map((task) => (
              <div
                key={task.id}
                className={`group flex items-start gap-3 p-3 rounded-xl border transition-all ${
                  task.done
                    ? "bg-emerald-50/30 border-emerald-200/40"
                    : "bg-card border-border/60 hover:border-border hover:shadow-sm"
                }`}
              >
                <button onClick={() => toggleTask(task.id)} className="flex-shrink-0 mt-0.5">
                  {task.done ? (
                    <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500" />
                  ) : (
                    <Circle className="w-4.5 h-4.5 text-muted-foreground/30 hover:text-primary transition-colors" />
                  )}
                </button>
                <span
                  className={`flex-1 text-sm leading-relaxed ${
                    task.done ? "text-muted-foreground line-through" : "text-foreground"
                  }`}
                >
                  {task.text}
                </span>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 p-1 rounded-lg hover:bg-red-50"
                >
                  <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-red-500" />
                </button>
              </div>
            ))}
            {clientTasks.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No client tasks yet.</p>
            )}
          </div>
        </div>

        {/* Internal column */}
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-gradient-to-br from-[#7A9E9E]/10 to-[#7A9E9E]/5 border-b border-border/50 px-5 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#7A9E9E]/20 border border-[#7A9E9E]/20 flex items-center justify-center">
                  <Users className="w-4 h-4 text-[#7A9E9E]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">For the Internal Team</p>
                  <p className="text-[11px] font-mono text-muted-foreground">{internalDone} of {internalTasks.length} complete</p>
                </div>
              </div>
            </div>
          </div>
          <div className="p-4 space-y-1.5">
            {internalTasks.map((task) => (
              <div
                key={task.id}
                className={`group flex items-start gap-3 p-3 rounded-xl border transition-all ${
                  task.done
                    ? "bg-emerald-50/30 border-emerald-200/40"
                    : "bg-card border-border/60 hover:border-border hover:shadow-sm"
                }`}
              >
                <button onClick={() => toggleTask(task.id)} className="flex-shrink-0 mt-0.5">
                  {task.done ? (
                    <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500" />
                  ) : (
                    <Circle className="w-4.5 h-4.5 text-muted-foreground/30 hover:text-primary transition-colors" />
                  )}
                </button>
                <span
                  className={`flex-1 text-sm leading-relaxed ${
                    task.done ? "text-muted-foreground line-through" : "text-foreground"
                  }`}
                >
                  {task.text}
                </span>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 p-1 rounded-lg hover:bg-red-50"
                >
                  <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-red-500" />
                </button>
              </div>
            ))}
            {internalTasks.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No internal tasks yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Save bar ── */}
      {saved ? (
        <div className="flex items-center gap-4 bg-emerald-50 border border-emerald-200 rounded-2xl shadow-sm px-6 py-4">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-emerald-800">Tasks saved to client history</p>
            <p className="text-xs text-emerald-600">{clientTasks.length} client · {internalTasks.length} internal</p>
          </div>
          <button
            onClick={() => router.push(`/session-detail?sessionId=${sessionId}`)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors"
          >
            View in history <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between bg-card border border-border rounded-2xl shadow-md px-6 py-4">
          <p className="text-xs text-muted-foreground font-mono">
            {tasks.length} task{tasks.length !== 1 ? "s" : ""} · {clientTasks.length} client, {internalTasks.length} internal
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(`/results?sessionId=${sessionId}`)}
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowRight className="w-3 h-3 rotate-180" />
              Back to Results
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-[0.98] shadow-sm ${
                saving
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg"
              }`}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? "Saving…" : "Save to Client History"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NextStepsPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    }>
      <NextStepsInner />
    </Suspense>
  );
}
