"use client";

import { Suspense, useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import { useClients, useSessions } from "@/lib/supabase/hooks";

function groupByDate(sessions: { date: string }[]): Record<string, string> {
  const now = new Date();
  const today = now.toDateString();
  const yesterday = new Date(now.getTime() - 86400000).toDateString();

  const groups: Record<string, string[]> = {};
  for (const s of sessions) {
    const d = new Date(s.date);
    const key = d.toDateString() === today ? "Today" : d.toDateString() === yesterday ? "Yesterday" : "Earlier";
    if (!groups[key]) groups[key] = [];
    groups[key].push(s.date);
  }
  return Object.fromEntries(
    Object.entries(groups).map(([k, v]) => [k, v[0]])
  ) as Record<string, string>;
}

function HistoryInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: clients } = useClients();
  const { data: sessions } = useSessions();
  const [selectedClient, setSelectedClient] = useState<string | null>(null);

  useEffect(() => {
    const clientId = searchParams.get("clientId");
    if (clientId) setSelectedClient(clientId);
  }, [searchParams]);

  const filtered = useMemo(() => {
    if (!sessions) return [];
    return selectedClient
      ? sessions.filter((s) => s.clientId === selectedClient)
      : sessions;
  }, [sessions, selectedClient]);

  const grouped = useMemo(() => {
    const now = new Date();
    const today = now.toDateString();
    const yesterday = new Date(now.getTime() - 86400000).toDateString();

    const groups: { label: string; sessions: typeof filtered }[] = [
      { label: "Today", sessions: [] },
      { label: "Yesterday", sessions: [] },
      { label: "This week", sessions: [] },
      { label: "Older", sessions: [] },
    ];

    for (const s of filtered) {
      const d = new Date(s.date);
      const ds = d.toDateString();
      const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);

      if (ds === today) groups[0].sessions.push(s);
      else if (ds === yesterday) groups[1].sessions.push(s);
      else if (diffDays < 7) groups[2].sessions.push(s);
      else groups[3].sessions.push(s);
    }

    return groups.filter((g) => g.sessions.length > 0);
  }, [filtered]);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1
            className="text-2xl font-semibold text-foreground"
            style={{ fontFamily: "var(--font-lora), serif" }}
          >
            History
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filtered.length} session{filtered.length !== 1 ? "s" : ""}
            {selectedClient && clients
              ? ` · ${clients.find((c) => c.id === selectedClient)?.name ?? "Client"}`
              : ""}
          </p>
        </div>
        <button
          onClick={() => router.push("/new-session")}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Session
        </button>
      </div>

      {/* Client filter — horizontal pills */}
      <div className="flex items-center gap-1.5 mb-8 flex-wrap">
        <button
          onClick={() => setSelectedClient(null)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            !selectedClient
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
          }`}
        >
          All
        </button>
        {(clients ?? []).map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedClient(c.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedClient === c.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Sessions grouped by date */}
      {grouped.length === 0 && (
        <div className="bg-card border border-border rounded-[14px] p-10 text-center">
          {selectedClient ? (
            <div>
              <p className="text-sm text-foreground font-medium mb-1">No sessions for this client</p>
              <p className="text-xs text-muted-foreground">
                {clients?.find((c) => c.id === selectedClient)?.name ?? "Client"} has no completed analyses yet.
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-foreground font-medium mb-1">No sessions yet</p>
              <p className="text-xs text-muted-foreground">
                Start a new session to upload data and run your first analysis.
              </p>
            </div>
          )}
        </div>
      )}

      <div className="space-y-8">
        {grouped.map((group) => (
          <div key={group.label}>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs font-mono font-semibold tracking-widest text-muted-foreground uppercase">
                {group.label}
              </span>
              <div className="flex-1 h-px bg-border" />
              <span className="text-[10px] font-mono text-muted-foreground">{group.sessions.length}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {group.sessions.map((session) => {
                const client = clients?.find((c) => c.id === session.clientId);
                return (
                  <div
                    key={session.id}
                    onClick={() => router.push(`/session-detail?sessionId=${session.id}`)}
                    className="bg-card border border-border rounded-2xl p-4 hover:border-primary/20 transition-all cursor-pointer group active:scale-[0.99]"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-2">
                        {session.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono mb-3">
                      <span>{client?.name ?? "Client"}</span>
                      <span className="text-muted-foreground/30">·</span>
                      <span>{session.date}</span>
                      {session.consultant && (
                        <>
                          <span className="text-muted-foreground/30">·</span>
                          <span>{session.consultant}</span>
                        </>
                      )}
                    </div>
                    {session.summary && (
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                        {session.summary}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HistoryPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    }>
      <HistoryInner />
    </Suspense>
  );
}
