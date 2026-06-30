import { getSupabase } from "./client";
import type { Client, Session, SessionInput, SessionOutput, ConsultantNote } from "@/types";
import type { PostgrestError } from "@supabase/supabase-js";

// ── Row shapes from Supabase ──

interface ClientRow {
  id: string;
  name: string;
  sector: string;
  created_at: string;
}

interface SessionRow {
  id: string;
  client_id: string;
  title: string;
  status: "draft" | "complete";
  analysis_type: string[];
  consultant: string;
  confidence: number;
  date: string;
  goal: string;
  summary: string;
  created_at: string;
}

interface SessionInputRow {
  id: string;
  session_id: string;
  brief_text: string;
  business_goal: string;
  constraints: string;
  data_files: any[];
  created_at: string;
}

interface SessionOutputRow {
  id: string;
  session_id: string;
  exec_summary: string;
  key_signals: any[];
  data_quality_flags: any[];
  recommended_analyses: any[];
  follow_up_questions: any[];
  assumptions: any[];
  confidence_score: number;
  data_completeness: number;
  created_at: string;
}

interface ConsultantNoteRow {
  id: string;
  session_id: string;
  note_text: string;
  created_at: string;
}

// ── Mappers ──

function toClient(row: ClientRow, sessionCount: number): Client {
  return {
    id: row.id,
    name: row.name,
    sector: row.sector,
    sessions: sessionCount,
    lastActive: timeAgo(row.created_at),
    createdAt: row.created_at,
  };
}

function toSession(row: SessionRow): Session {
  return {
    id: row.id,
    clientId: row.client_id,
    title: row.title,
    status: row.status,
    analysisType: row.analysis_type ?? [],
    consultant: row.consultant ?? "",
    confidence: row.confidence ?? 0,
    date: row.date ?? formatDate(row.created_at),
    goal: row.goal ?? "",
    summary: row.summary ?? "",
    createdAt: row.created_at,
  };
}

function toSessionInput(row: SessionInputRow): SessionInput {
  return {
    id: row.id,
    sessionId: row.session_id,
    briefText: row.brief_text,
    businessGoal: row.business_goal,
    constraints: row.constraints,
    dataFiles: row.data_files ?? [],
    createdAt: row.created_at,
  };
}

function toSessionOutput(row: SessionOutputRow): SessionOutput {
  return {
    id: row.id,
    sessionId: row.session_id,
    execSummary: row.exec_summary,
    keySignals: row.key_signals ?? [],
    dataQualityFlags: row.data_quality_flags ?? [],
    recommendedAnalyses: row.recommended_analyses ?? [],
    followUpQuestions: row.follow_up_questions ?? [],
    assumptions: row.assumptions ?? [],
    confidenceScore: row.confidence_score ?? 0,
    dataCompleteness: row.data_completeness ?? 0,
    createdAt: row.created_at,
  };
}

function toConsultantNote(row: ConsultantNoteRow): ConsultantNote {
  return {
    id: row.id,
    sessionId: row.session_id,
    noteText: row.note_text,
    createdAt: row.created_at,
  };
}

// ── Helpers ──

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return "1 week ago";
  return `${weeks} weeks ago`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ── Queries ──

export async function getClients(): Promise<Client[]> {
  const { data: clients, error } = await getSupabase()
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;

  const { data: allSessions } = await getSupabase()
    .from("sessions")
    .select("client_id");

  const countMap: Record<string, number> = {};
  for (const s of (allSessions as { client_id: string }[] | null) ?? []) {
    countMap[s.client_id] = (countMap[s.client_id] ?? 0) + 1;
  }

  return (clients as ClientRow[]).map((client) =>
    toClient(client, countMap[client.id] ?? 0)
  );
}

export async function getSessions(limit = 50): Promise<Session[]> {
  const { data, error } = await getSupabase()
    .from("sessions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data as SessionRow[]).map(toSession);
}

export async function getSessionsByClient(clientId: string): Promise<Session[]> {
  const { data, error } = await getSupabase()
    .from("sessions")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as SessionRow[]).map(toSession);
}

export async function getSessionById(id: string): Promise<{
  session: Session;
  input: SessionInput | null;
  output: SessionOutput | null;
  notes: ConsultantNote[];
  client: Client | null;
}> {
  const { data: s, error: se } = await getSupabase()
    .from("sessions")
    .select("*")
    .eq("id", id)
    .single();
  if (se) throw se;
  const session = toSession(s as SessionRow);

  const { data: inp } = await getSupabase()
    .from("session_inputs")
    .select("*")
    .eq("session_id", id)
    .single();
  const input = inp ? toSessionInput(inp as SessionInputRow) : null;

  const { data: out } = await getSupabase()
    .from("session_outputs")
    .select("*")
    .eq("session_id", id)
    .single();
  const output = out ? toSessionOutput(out as SessionOutputRow) : null;

  const { data: notes } = await getSupabase()
    .from("consultant_notes")
    .select("*")
    .eq("session_id", id)
    .order("created_at", { ascending: false });
  const cnotes = (notes as ConsultantNoteRow[] | null)?.map(toConsultantNote) ?? [];

  const { data: c } = await getSupabase()
    .from("clients")
    .select("*")
    .eq("id", session.clientId)
    .single();
  const client = c ? toClient(c as ClientRow, 0) : null;

  return { session, input, output, notes: cnotes, client };
}

export async function getClientById(id: string): Promise<Client | null> {
  const { data, error } = await getSupabase()
    .from("clients")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  const row = data as ClientRow;
  const { count } = await getSupabase()
    .from("sessions")
    .select("*", { count: "exact", head: true })
    .eq("client_id", row.id);
  return toClient(row, count ?? 0);
}

export async function getRecentSessions(limit = 4): Promise<Session[]> {
  return getSessions(limit);
}

// ── Mutations ──

interface CreateSessionInput {
  clientId: string;
  title: string;
  consultant: string;
  analysisType: string[];
}

export async function createSession(input: CreateSessionInput): Promise<Session> {
  const { data, error } = await getSupabase()
    .from("sessions")
    .insert({
      client_id: input.clientId,
      title: input.title,
      consultant: input.consultant,
      analysis_type: input.analysisType,
      status: "draft",
      date: formatDate(new Date().toISOString()),
    })
    .select()
    .single();
  if (error) throw error;
  return toSession(data as SessionRow);
}

export async function saveSessionInput(
  sessionId: string,
  input: {
    briefText: string;
    businessGoal: string;
    constraints: string;
    dataFiles: any[];
  }
): Promise<SessionInput> {
  const { data, error } = await getSupabase()
    .from("session_inputs")
    .upsert({
      session_id: sessionId,
      brief_text: input.briefText,
      business_goal: input.businessGoal,
      constraints: input.constraints,
      data_files: input.dataFiles,
    })
    .select()
    .single();
  if (error) throw error;
  return toSessionInput(data as SessionInputRow);
}

export async function finalizeSession(
  sessionId: string,
  status: "complete" = "complete"
): Promise<void> {
  const { error } = await getSupabase()
    .from("sessions")
    .update({ status })
    .eq("id", sessionId);
  if (error) throw error;
}

export async function saveSessionOutput(
  sessionId: string,
  output: {
    execSummary: string;
    keySignals: string[];
    dataQualityFlags: any[];
    recommendedAnalyses: any[];
    followUpQuestions: string[];
    assumptions: string[];
    confidenceScore: number;
    dataCompleteness: number;
  }
): Promise<SessionOutput> {
  const { data, error } = await getSupabase()
    .from("session_outputs")
    .upsert({
      session_id: sessionId,
      exec_summary: output.execSummary,
      key_signals: output.keySignals,
      data_quality_flags: output.dataQualityFlags,
      recommended_analyses: output.recommendedAnalyses,
      follow_up_questions: output.followUpQuestions,
      assumptions: output.assumptions,
      confidence_score: output.confidenceScore,
      data_completeness: output.dataCompleteness,
    })
    .select()
    .single();
  if (error) throw error;
  return toSessionOutput(data as SessionOutputRow);
}

export async function addConsultantNote(
  sessionId: string,
  noteText: string
): Promise<ConsultantNote> {
  const { data, error } = await getSupabase()
    .from("consultant_notes")
    .insert({ session_id: sessionId, note_text: noteText })
    .select()
    .single();
  if (error) throw error;
  return toConsultantNote(data as ConsultantNoteRow);
}
