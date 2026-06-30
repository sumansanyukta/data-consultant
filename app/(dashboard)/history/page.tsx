"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, ChevronRight, Loader2 } from "lucide-react";
import { useClients, useSessions } from "@/lib/supabase/hooks";

function HistoryInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: clients } = useClients();
  const { data: sessions } = useSessions();
  const [selectedClient, setSelectedClient] = useState<string | null>(null);

  useEffect(() => {
    const clientId = searchParams.get("clientId");
    if (clientId) {
      setSelectedClient(clientId);
    }
  }, [searchParams]);

  const filtered = selectedClient && sessions
    ? sessions.filter((s) => s.clientId === selectedClient)
    : sessions ?? [];

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-7">
        <div>
          <h1
            className="text-2xl font-semibold text-foreground"
            style={{ fontFamily: "var(--font-lora), serif" }}
          >
            Client History
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            All saved sessions across clients — ordered by date.
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

      <div className="grid grid-cols-5 gap-6">
        {/* Client filter */}
        <div className="col-span-1">
          <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase font-mono mb-3">
            Filter by client
          </p>
          <div className="space-y-1">
            <button
              onClick={() => setSelectedClient(null)}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                !selectedClient
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              All clients
            </button>
            {(clients ?? []).map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedClient(c.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                  selectedClient === c.id
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {c.name.split(" ").slice(0, 2).join(" ")}
              </button>
            ))}
          </div>
        </div>

        {/* Sessions timeline */}
        <div className="col-span-4">
          <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase font-mono mb-3">
            {filtered.length} session{filtered.length !== 1 ? "s" : ""}
          </p>
          <div className="space-y-3">
            {filtered.length === 0 && (
              <div className="bg-card border border-border rounded-[14px] p-8 text-center">
                <p className="text-sm text-muted-foreground">No sessions found.</p>
              </div>
            )}
            {filtered.map((session) => (
              <div
                key={session.id}
                onClick={() => router.push(`/session-detail?sessionId=${session.id}`)}
                className="bg-card border border-border rounded-[14px] p-5 hover:border-primary/20 transition-colors cursor-pointer group"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5 ${
                      session.status === "complete"
                        ? "bg-emerald-500"
                        : "bg-amber-400"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-1">
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">
                          {session.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                          {session.consultant} · {session.date}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span
                          className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full font-mono tracking-wide ${
                            session.status === "complete"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {session.status}
                        </span>
                        <span className="text-[11px] font-mono text-muted-foreground">
                          {session.confidence}% conf.
                        </span>
                      </div>
                    </div>
                    {session.summary && (
                      <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                        {session.summary}
                      </p>
                    )}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 max-w-[200px]">
                        <div className="flex items-center gap-2.5">
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
                          <span className="text-xs font-mono text-muted-foreground">
                            {session.confidence}%
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/session-detail?sessionId=${session.id}`);
                        }}
                        className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                      >
                        Open session <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
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
