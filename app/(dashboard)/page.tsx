"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Upload, FileText, X, Sparkles, Loader2, AlertCircle } from "lucide-react";
import Papa from "papaparse";
import { getSupabase } from "@/lib/supabase/client";
import { createSession } from "@/lib/supabase/queries";
import { useRecentSessions } from "@/lib/supabase/hooks";

interface ParsedFile {
  fileName: string;
  rowCount: number;
  columnCount: number;
  sizeKb: number;
  csvContent: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { data: sessions } = useRecentSessions(4);
  const [parsedFile, setParsedFile] = useState<ParsedFile | null>(null);
  const [question, setQuestion] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState("");
  const [clientName, setClientName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    if (!file.name.endsWith(".csv")) {
      setError("Only CSV files are supported");
      return;
    }
    setUploading(true);
    try {
      const text = await file.text();
      const result = Papa.parse(text, { header: true, skipEmptyLines: true });
      const derivedName = file.name.replace(/\.csv$/i, "").replace(/[_-]/g, " ");
      setClientName(derivedName);
      setParsedFile({
        fileName: file.name,
        rowCount: result.data.length,
        columnCount: (result.meta.fields ?? []).length,
        sizeKb: Math.round(file.size / 1024),
        csvContent: text,
      });
    } catch (e: any) {
      setError(e.message ?? "Failed to read file");
    } finally {
      setUploading(false);
    }
  }, []);

  const onDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) await handleFile(file);
  }, [handleFile]);

  const onFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await handleFile(file);
  }, [handleFile]);

  const runAnalysis = async () => {
    if (!parsedFile) return;
    setRunning(true);
    setPhase("Creating client…");
    setError(null);
    try {
      const sb = getSupabase();
      const projectName = clientName.trim() || parsedFile.fileName.replace(/\.csv$/i, "").replace(/[_-]/g, " ");

      const { data: client, error: ce } = await sb
        .from("clients")
        .insert({ name: projectName, sector: "General" })
        .select()
        .single();
      if (ce) throw ce;

      setPhase("Creating session…");
      const session = await createSession({
        clientId: client.id,
        title: projectName,
        consultant: "",
        analysisType: ["Descriptive"],
      });

      setPhase("Uploading data…");
      const storagePath = `uploads/${session.id}/${parsedFile.fileName}`;
      const { error: ue } = await sb.storage
        .from("client-uploads")
        .upload(storagePath, new Blob([parsedFile.csvContent], { type: "text/csv" }), { upsert: true });
      if (ue) throw ue;

      setPhase("Running analysis…");
      const res = await fetch("/api/pipeline/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          csvContent: parsedFile.csvContent,
          fileName: parsedFile.fileName,
          storagePath,
          briefText: question,
          businessGoal: "diagnostic",
        }),
      });
      if (!res.ok) throw new Error(await res.text());

      router.push(`/analysis-running?sessionId=${session.id}`);
    } catch (e: any) {
      setError(e.message ?? "Analysis failed");
      setRunning(false);
    }
  };

  return (
    <div className="p-8">
      {/* Hero */}
      <div className="max-w-2xl mx-auto text-center mb-8">
        <h1
          className="text-3xl font-semibold text-foreground mb-2"
          style={{ fontFamily: "var(--font-lora), serif" }}
        >
          Upload your CSV. Get expert insights.
        </h1>
        <p className="text-sm text-muted-foreground">
          Drop a file below, tell us what you&apos;re looking for, and let the analysis do the rest.
        </p>
      </div>

      {/* Upload + analyze card */}
      <div className="max-w-xl mx-auto">
        <div className="bg-card border border-border rounded-[14px] p-6">
          {parsedFile ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-3.5">
                <FileText className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{parsedFile.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {parsedFile.rowCount.toLocaleString()} rows · {parsedFile.columnCount} columns · {parsedFile.sizeKb} KB
                  </p>
                </div>
                <button onClick={() => { setParsedFile(null); setClientName(""); setError(null); }}
                  className="flex-shrink-0 p-1 rounded-lg hover:bg-emerald-100 transition-colors">
                  <X className="w-4 h-4 text-emerald-600" />
                </button>
              </div>

              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="What question are you trying to answer? (optional)"
                className="w-full bg-input-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />

              <input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Client / project name"
                className="w-full bg-input-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />

              <button
                onClick={runAnalysis}
                disabled={running}
                className={`w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-colors shadow-sm ${
                  !running
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                }`}
              >
                {running ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {phase}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Analyze My Data
                  </>
                )}
              </button>
            </div>
          ) : (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { setDragOver(false); onDrop(e); }}
              onClick={() => document.getElementById("csv-upload")?.click()}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
                dragOver
                  ? "border-primary bg-accent"
                  : "hover:border-primary/40 hover:bg-muted/40 border-border"
              }`}
            >
              {uploading ? (
                <div>
                  <Loader2 className="w-10 h-10 text-primary mx-auto mb-3 animate-spin" />
                  <p className="text-sm text-muted-foreground">Reading file...</p>
                </div>
              ) : (
                <div>
                  <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-base font-medium text-foreground mb-1">Drop your CSV here</p>
                  <p className="text-xs text-muted-foreground">or click to browse · Max 50 MB</p>
                </div>
              )}
              <input id="csv-upload" type="file" accept=".csv" className="hidden" onChange={onFileSelect} />
            </div>
          )}

          {error && (
            <div className="mt-3 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent sessions */}
      {sessions && sessions.length > 0 && (
        <div className="max-w-2xl mx-auto mt-12">
          <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase font-mono mb-3">
            Recent Analyses
          </p>
          <div className="bg-card border border-border rounded-[14px] divide-y divide-border">
            {sessions.map((session) => (
              <Link
                key={session.id}
                href={`/session-detail?sessionId=${session.id}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-muted/50 transition-colors first:rounded-t-[14px] last:rounded-b-[14px]"
              >
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${session.status === "complete" ? "bg-emerald-500" : "bg-amber-400"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{session.title}</p>
                  <p className="text-xs text-muted-foreground">{session.date}</p>
                </div>
                <div className="flex items-center gap-2.5 w-24 flex-shrink-0">
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${session.confidence >= 75 ? "bg-emerald-500" : session.confidence >= 55 ? "bg-amber-500" : "bg-red-400"}`}
                      style={{ width: `${session.confidence}%` }} />
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">{session.confidence}%</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
