"use client";

import { useEffect, useState, useCallback } from "react";
import type { Client, Session, SessionOutput, ConsultantNote } from "@/types";
import * as q from "./queries";

// ── Generic fetch hook ──

function useFetch<T>(fetcher: () => Promise<T>, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      setData(result);
    } catch (e: any) {
      setError(e.message ?? "An error occurred");
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, refetch: load };
}

// ── Specific hooks ──

export function useClients() {
  return useFetch(() => q.getClients());
}

export function useSessions(limit?: number) {
  return useFetch(() => q.getSessions(limit), [limit]);
}

export function useSessionsByClient(clientId: string | null) {
  return useFetch(
    () => (clientId ? q.getSessionsByClient(clientId) : q.getSessions()),
    [clientId]
  );
}

export function useSessionDetail(id: string | null) {
  return useFetch(() => (id ? q.getSessionById(id) : Promise.resolve(null)), [id]);
}

export function useClient(id: string | null) {
  return useFetch(() => (id ? q.getClientById(id) : Promise.resolve(null)), [id]);
}

export function useRecentSessions(limit = 4) {
  return useFetch(() => q.getRecentSessions(limit), [limit]);
}

export function useDashboardStats() {
  return useFetch(() => q.getDashboardStats());
}
