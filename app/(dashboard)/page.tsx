"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, History, ArrowRight, BarChart3, Users, Clock } from "lucide-react";
import { useClients, useSessions } from "@/lib/supabase/hooks";

export default function DashboardPage() {
  const router = useRouter();
  const { data: sessions } = useSessions(5);
  const { data: clients } = useClients();

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "today";
    if (days === 1) return "yesterday";
    if (days < 7) return `${days} days ago`;
    const weeks = Math.floor(days / 7);
    if (weeks <= 4) return `${weeks}w ago`;
    return `${Math.floor(days / 30)}mo ago`;
  }

  const stats = [
    { label: "Sessions", value: sessions?.length ?? 0, icon: BarChart3, bg: "from-primary/5 to-primary/[0.02]" },
    { label: "Clients", value: clients?.length ?? 0, icon: Users, bg: "from-accent/60 to-accent/20" },
    ...(sessions?.[0]
      ? [{ label: "Last analysis", value: timeAgo(sessions[0].date), icon: Clock, bg: "from-muted/60 to-muted/20" }]
      : []),
  ];

  return (
    <div className="p-10 max-w-3xl mx-auto">
      {/* ── Hero ── */}
      <div className="mb-12">
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-[0.15em] mb-2 font-semibold">
          {sessions && sessions.length > 0 ? `${sessions.length} analyses completed` : "Welcome"}
        </p>
        <h1
          className="text-[32px] font-semibold text-foreground mb-3 leading-tight tracking-tight"
          style={{ fontFamily: "var(--font-lora), serif" }}
        >
          Turn data into consulting insights
        </h1>
        <p className="text-sm text-muted-foreground max-w-lg leading-relaxed mb-6">
          Upload a dataset, describe your brief, and get a structured analysis with key signals,
          quality flags, and recommended next steps — ready for your client report.
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/new-session")}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Start New Session
          </button>
          <button
            onClick={() => router.push("/history")}
            className="inline-flex items-center gap-2 bg-card border border-border text-foreground px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-muted transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
          >
            <History className="w-4 h-4" />
            Browse History
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      {sessions && sessions.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-12">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className="bg-card border border-border rounded-[14px] p-5 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.bg} border border-border/50 flex items-center justify-center`}>
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                </div>
                <p className="text-2xl font-semibold text-foreground tracking-tight">{s.value}</p>
                <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Empty state ── */}
      {(!sessions || sessions.length === 0) && (
        <div className="bg-card border border-border rounded-[14px] shadow-sm p-10 text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-xl bg-gradient-to-br from-primary/5 to-primary/[0.02] border border-border/50 flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-primary/60" />
          </div>
          <p className="text-base font-semibold text-foreground mb-1">No analyses yet</p>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Start a new session to upload data and run your first analysis.
          </p>
          <button
            onClick={() => router.push("/new-session")}
            className="mt-5 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Create your first session <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* ── Recent sessions ── */}
      {sessions && sessions.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <p className="text-xs font-semibold tracking-widest text-foreground uppercase font-mono">
              Recent Analyses
            </p>
            <div className="flex-1 h-px bg-border/60" />
            <Link
              href="/history"
              className="text-[11px] font-medium text-primary hover:text-primary/80 transition-colors font-mono"
            >
              View all &rarr;
            </Link>
          </div>
          <div className="space-y-3">
            {sessions.slice(0, 5).map((session) => {
              const client = clients?.find((c) => c.id === session.clientId);
              return (
                <Link
                  key={session.id}
                  href={`/session-detail?sessionId=${session.id}`}
                  className="block bg-card border border-border rounded-[14px] shadow-sm hover:shadow-md transition-all p-5 group active:scale-[0.995]"
                  title={`${session.title} — ${session.confidence}% confidence`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-1 h-10 rounded-full flex-shrink-0 ${
                        session.confidence >= 75
                          ? "bg-emerald-400"
                          : session.confidence >= 55
                            ? "bg-amber-400"
                            : "bg-primary/40"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                        {session.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {client?.name ?? "Client"} · {session.date}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 w-32 flex-shrink-0">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            session.confidence >= 75
                              ? "bg-emerald-500"
                              : session.confidence >= 55
                                ? "bg-amber-500"
                                : "bg-red-400"
                          }`}
                          style={{ width: `${session.confidence}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono text-muted-foreground w-8 text-right tabular-nums">
                        {session.confidence}%
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors flex-shrink-0" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
