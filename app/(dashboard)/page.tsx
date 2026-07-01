"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, History, Database, ChevronRight, ArrowRight } from "lucide-react";
import { useClients, useSessions } from "@/lib/supabase/hooks";

export default function DashboardPage() {
  const router = useRouter();
  const { data: sessions } = useSessions(5);
  const { data: clients } = useClients();

  const stats = [
    { label: "Sessions", value: sessions?.length ?? 0 },
    { label: "Clients", value: clients?.length ?? 0 },
    ...(sessions?.[0] ? [{ label: "Latest", value: sessions[0].date }] : []),
  ];

  return (
    <div className="p-8">
      {/* ── Hero ── */}
      <div className="max-w-2xl mx-auto text-center pt-6 pb-8">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
          <Database className="w-6 h-6 text-primary" />
        </div>
        <h1
          className="text-3xl font-semibold text-foreground mb-3 leading-tight"
          style={{ fontFamily: "var(--font-lora), serif" }}
        >
          Turn data into consulting insights
        </h1>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto mb-7 leading-relaxed">
          Upload a dataset, describe your brief, and get a structured analysis with key signals, quality flags,
          and recommended next steps — ready for your client report.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => router.push("/new-session")}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Start New Session
          </button>
          <button
            onClick={() => router.push("/history")}
            className="inline-flex items-center gap-2 bg-card border border-border text-foreground px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-muted transition-colors"
          >
            <History className="w-4 h-4" />
            Browse History
          </button>
        </div>
      </div>

      {/* ── Empty state ── */}
      {(!sessions || sessions.length === 0) && (
        <div className="max-w-lg mx-auto mt-4">
          <div className="bg-card border border-border rounded-[14px] p-8 text-center">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
              <Database className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">No analyses yet</p>
            <p className="text-xs text-muted-foreground">
              Start a new session to upload data and run your first analysis.
            </p>
            <button
              onClick={() => router.push("/new-session")}
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
            >
              Create your first session <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* ── Stats ── */}
      {sessions && sessions.length > 0 && (
        <div className="max-w-2xl mx-auto mb-10">
          <div className="bg-card border border-border rounded-[14px] px-6 py-4 flex items-center justify-center gap-8">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-lg font-semibold text-foreground">{s.value}</p>
                <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Recent sessions ── */}
      {sessions && sessions.length > 0 && (
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase font-mono">
              Recent Analyses
            </p>
            <Link
              href="/history"
              className="text-[11px] font-medium text-primary hover:underline font-mono"
            >
              View all →
            </Link>
          </div>
          <div className="bg-card border border-border rounded-[14px] divide-y divide-border">
            {sessions.slice(0, 5).map((session) => {
              const client = clients?.find((c) => c.id === session.clientId);
              return (
                <Link
                  key={session.id}
                  href={`/session-detail?sessionId=${session.id}`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-muted/50 transition-colors first:rounded-t-[14px] last:rounded-b-[14px] group"
                >
                  <div
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      session.status === "complete" ? "bg-emerald-500" : "bg-amber-400"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                      {session.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {client?.name ?? "Client"} · {session.date}
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5 w-28 flex-shrink-0">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
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
                    <span className="text-xs font-mono text-muted-foreground w-8 text-right">
                      {session.confidence}%
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors flex-shrink-0" />
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
