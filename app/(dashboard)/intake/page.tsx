"use client";

import { Suspense, useState, useCallback, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Upload,
  AlertCircle,
  X,
  FileText,
  Loader2,
  BarChart3,
  Check,
} from "lucide-react";
import Papa from "papaparse";
import { getSupabase } from "@/lib/supabase/client";

interface ParsedFile {
  fileName: string;
  fileType: "csv" | "xlsx" | "json";
  fileUrl: string;
  rowCount: number;
  columnCount: number;
  sizeKb: number;
  columns: string[];
  sample: Record<string, unknown>[];
  rawDtypes: Record<string, string>;
  nullPct: Record<string, number>;
  sessionId: string;
}

function inferDtype(values: (string | number | boolean | null | undefined)[]): string {
  const nonNull = values.filter((v) => v != null && v !== "");
  if (nonNull.length === 0) return "unknown";
  const numericCount = nonNull.filter((v) => !isNaN(Number(v)) && v !== true && v !== false).length;
  if (numericCount / nonNull.length > 0.8) return "numeric";
  const dateCount = nonNull.filter((v) => !isNaN(Date.parse(String(v)))).length;
  if (dateCount / nonNull.length > 0.8) return "date";
  return "text";
}

function computeNullPct(rows: Record<string, unknown>[], col: string): number {
  if (rows.length === 0) return 0;
  const nulls = rows.filter((r) => r[col] == null || r[col] === "").length;
  return Math.round((nulls / rows.length) * 100);
}

const BRIEF_PRESETS = [
  {
    id: "explore",
    label: "Explore the data",
    text: "I have a dataset and need to explore it for trends, outliers, and patterns that could inform business decisions. A broad exploratory analysis would help understand what the data can tell us.",
  },
  {
    id: "metric",
    label: "Why is a metric changing?",
    text: "We've observed a significant change in a key metric and need to understand the root cause. We want to identify which factors are driving the change and quantify their contribution.",
  },
  {
    id: "predict",
    label: "Predict an outcome",
    text: "We have historical data on past outcomes and want to forecast future results based on the patterns in our data, so we can plan and allocate resources more effectively.",
  },
  {
    id: "segment",
    label: "Find patterns or segments",
    text: "We want to segment our data to identify distinct groups — whether by customer behaviour, operational performance, or other dimensions — so we can tailor strategies accordingly.",
  },
];

const OBJECTIVES = [
  { id: "diagnostic", label: "Diagnostic", desc: "Why did it happen?" },
  { id: "descriptive", label: "Descriptive", desc: "What is happening?" },
  { id: "predictive", label: "Predictive", desc: "What will happen?" },
  { id: "prescriptive", label: "Prescriptive", desc: "What should we do?" },
];

function IntakeInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId") ?? crypto.randomUUID();
  const isSample = searchParams.get("sample") === "true";
  const sampleLoaded = useRef(false);

  const initialStep = searchParams.get("step") ? Number(searchParams.get("step")) : 1;
  const [step, setStep] = useState(initialStep);
  const [brief, setBrief] = useState("");
  const [goal, setGoal] = useState("diagnostic");
  const [parsedFile, setParsedFile] = useState<ParsedFile | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [csvContent, setCsvContent] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  // Auto-load sample data
  useEffect(() => {
    if (!isSample || sampleLoaded.current) return;
    (async () => {
      try {
        const res = await fetch("/api/session/sample");
        const text = await res.text();
        const file = new File([text], "sample-data.csv", { type: "text/csv" });
        sampleLoaded.current = true;
        await handleFile(file);
        setBrief(
          "Our e-commerce client has provided a transaction dataset covering Q4 2025 through mid-January 2026. " +
          "We need to assess overall sales performance, identify top-performing product categories and regions, " +
          "understand customer segment behaviour, and detect any quality issues in the data. " +
          "The goal is to produce a diagnostic review with actionable recommendations for improving revenue and customer retention."
        );
        setGoal("diagnostic");
      } catch {
        sampleLoaded.current = false;
      }
    })();
  }, [isSample]);

  const handleFile = useCallback(async (file: File) => {
    setUploadError(null);
    setUploading(true);
    try {
      if (!file.name.endsWith(".csv")) {
        setUploadError("Only CSV files are supported at this time");
        setUploading(false);
        return;
      }
      const text = await file.text();
      setCsvContent(text);
      const result = Papa.parse(text, { header: true, skipEmptyLines: true, preview: 100 });
      const headers = result.meta.fields ?? [];
      const sample = result.data as Record<string, unknown>[];
      const fullResult = Papa.parse(text, { header: true, skipEmptyLines: true });
      const totalRows = fullResult.data.length;
      const rawDtypes: Record<string, string> = {};
      for (const col of headers) {
        rawDtypes[col] = inferDtype(sample.map((r) => r[col] as string | number | boolean | null | undefined));
      }
      const nullSample = (fullResult.data as Record<string, unknown>[]).slice(0, 1000);
      const nullPct: Record<string, number> = {};
      for (const col of headers) {
        nullPct[col] = computeNullPct(nullSample, col);
      }
      const sb = getSupabase();
      const storagePath = `uploads/${sessionId}/${file.name}`;
      const { error: uploadErr } = await sb.storage
        .from("client-uploads")
        .upload(storagePath, file, { upsert: true });
      if (uploadErr) {
        setUploadError(uploadErr.message);
        setUploading(false);
        return;
      }
      setParsedFile({
        fileName: file.name,
        fileType: "csv",
        fileUrl: storagePath,
        rowCount: totalRows,
        columnCount: headers.length,
        sizeKb: Math.round(file.size / 1024),
        columns: headers,
        sample: sample.slice(0, 5),
        rawDtypes,
        nullPct,
        sessionId,
      });
    } catch (e: any) {
      setUploadError(e.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  }, [sessionId]);

  const onDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) await handleFile(file);
  }, [handleFile]);

  const onFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await handleFile(file);
  }, [handleFile]);

  const removeFile = () => {
    setParsedFile(null);
    setUploadError(null);
  };

  const runAnalysis = async () => {
    if (!parsedFile || !csvContent) return;
    setRunning(true);
    try {
      const res = await fetch("/api/pipeline/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          csvContent,
          fileName: parsedFile.fileName,
          storagePath: parsedFile.fileUrl,
          briefText: brief,
          businessGoal: goal,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      router.push(`/analysis-running?sessionId=${sessionId}`);
    } catch {
      setRunning(false);
    }
  };

  const canContinue = {
    1: brief.length >= 20,
    2: !!parsedFile,
  };

  return (
    <div className="p-8 max-w-lg mx-auto">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-10">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-mono font-semibold transition-all duration-300 ${
                s === step
                  ? "bg-primary text-primary-foreground"
                  : s < step
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {s < step ? <Check className="w-3.5 h-3.5" /> : s}
            </div>
            {s < 3 && (
              <div className={`w-8 h-px ${s < step ? "bg-emerald-300" : "bg-border"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Brief */}
      {step === 1 && (
        <div className="animate-in fade-in duration-300">
          <div className="text-center mb-8">
            <h1
              className="text-xl font-semibold text-foreground mb-1.5"
              style={{ fontFamily: "var(--font-lora), serif" }}
            >
              What brings you here?
            </h1>
            <p className="text-sm text-muted-foreground">
              Pick a starting point or write your own.
            </p>
          </div>

          {brief.length === 0 && (
            <div className="grid grid-cols-2 gap-2.5 mb-4">
              {BRIEF_PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setBrief(p.text)}
                  className="bg-card border border-border rounded-xl p-4 text-left hover:border-primary/30 hover:bg-muted/30 transition-all active:scale-[0.98]"
                >
                  <p className="text-xs font-semibold text-foreground mb-1">{p.label}</p>
                  <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2">
                    {p.text.slice(0, 80)}…
                  </p>
                </button>
              ))}
            </div>
          )}

          {brief.length > 0 && (
            <div className="bg-muted/50 rounded-xl px-4 py-3 mb-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs text-foreground leading-relaxed flex-1">{brief.slice(0, 200)}{brief.length > 200 ? "…" : ""}</p>
                <button
                  onClick={() => setBrief("")}
                  className="text-[10px] font-mono text-muted-foreground hover:text-foreground whitespace-nowrap"
                >
                  Change
                </button>
              </div>
            </div>
          )}

          <textarea
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            rows={4}
            placeholder="Or describe what you need in your own words…"
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none leading-relaxed mb-6"
          />

          <div className="flex justify-end">
            <button
              onClick={() => setStep(2)}
              disabled={!canContinue[1]}
              className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${
                canContinue[1]
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98]"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              }`}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Data */}
      {step === 2 && (
        <div className="animate-in fade-in duration-300">
          <div className="text-center mb-8">
            <h1
              className="text-xl font-semibold text-foreground mb-1.5"
              style={{ fontFamily: "var(--font-lora), serif" }}
            >
              Upload your data
            </h1>
            <p className="text-sm text-muted-foreground">
              Drag and drop a CSV file, or click to browse.
            </p>
          </div>

          {parsedFile ? (
            <div className="bg-card border border-border rounded-xl p-5 mb-6">
              <div className="flex items-start gap-3">
                <FileText className="w-8 h-8 text-primary flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{parsedFile.fileName}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono mt-1">
                    <span>{parsedFile.rowCount.toLocaleString()} rows</span>
                    <span>{parsedFile.columnCount} columns</span>
                    <span>{parsedFile.sizeKb} KB</span>
                  </div>
                </div>
                <button
                  onClick={removeFile}
                  className="flex-shrink-0 p-1.5 rounded-lg hover:bg-muted transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>
          ) : (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => document.getElementById("csv-upload")?.click()}
              className={`border-2 border-dashed rounded-xl py-14 text-center cursor-pointer transition-all mb-6 ${
                dragOver
                  ? "border-primary bg-accent"
                  : "border-border hover:border-primary/40 hover:bg-muted/30"
              }`}
            >
              {uploading ? (
                <div>
                  <Loader2 className="w-8 h-8 text-primary mx-auto mb-3 animate-spin" />
                  <p className="text-sm text-muted-foreground">Uploading…</p>
                </div>
              ) : (
                <div>
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm font-medium text-foreground">Drop CSV here</p>
                  <p className="text-xs text-muted-foreground mt-1">or click to browse · Max 50 MB</p>
                </div>
              )}
              <input id="csv-upload" type="file" accept=".csv" className="hidden" onChange={onFileSelect} />
            </div>
          )}

          {uploadError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-6">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-xs text-red-700">{uploadError}</p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              onClick={() => setStep(1)}
              className="text-xs text-muted-foreground hover:text-foreground font-mono transition-colors"
            >
              ← Back
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!canContinue[2]}
              className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${
                canContinue[2]
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98]"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              }`}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review & Run */}
      {step === 3 && (
        <div className="animate-in fade-in duration-300">
          <div className="text-center mb-8">
            <h1
              className="text-xl font-semibold text-foreground mb-1.5"
              style={{ fontFamily: "var(--font-lora), serif" }}
            >
              Review & run
            </h1>
            <p className="text-sm text-muted-foreground">
              Confirm your inputs and choose the analysis type.
            </p>
          </div>

          {/* Brief summary */}
          <div className="bg-card border border-border rounded-xl p-4 mb-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-mono font-semibold tracking-widest text-muted-foreground uppercase mb-1">
                  Brief
                </p>
                <p className="text-xs text-foreground leading-relaxed line-clamp-2">{brief}</p>
              </div>
              <button onClick={() => setStep(1)} className="text-[10px] font-mono text-primary hover:underline whitespace-nowrap">
                Edit
              </button>
            </div>
          </div>

          {/* File summary */}
          <div className="bg-card border border-border rounded-xl p-4 mb-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-mono font-semibold tracking-widest text-muted-foreground uppercase mb-1">
                  Data
                </p>
                <p className="text-xs text-foreground">
                  {parsedFile?.fileName} · {parsedFile?.rowCount.toLocaleString()} rows · {parsedFile?.columnCount} columns
                </p>
              </div>
              <button onClick={() => setStep(2)} className="text-[10px] font-mono text-primary hover:underline whitespace-nowrap">
                Edit
              </button>
            </div>
          </div>

          {/* Objective */}
          <div className="bg-card border border-border rounded-xl p-4 mb-6">
            <p className="text-[10px] font-mono font-semibold tracking-widest text-muted-foreground uppercase mb-3">
              Analysis type
            </p>
            <div className="grid grid-cols-2 gap-2">
              {OBJECTIVES.map((o) => (
                <button
                  key={o.id}
                  onClick={() => setGoal(o.id)}
                  className={`p-3 rounded-xl border text-left transition-all active:scale-[0.98] ${
                    goal === o.id
                      ? "border-primary/40 bg-accent ring-1 ring-primary/20"
                      : "border-border bg-muted/30 hover:border-muted-foreground/30"
                  }`}
                >
                  <p className={`text-xs font-semibold ${goal === o.id ? "text-accent-foreground" : "text-foreground"}`}>
                    {o.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{o.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={() => setStep(2)}
              className="text-xs text-muted-foreground hover:text-foreground font-mono transition-colors"
            >
              ← Back
            </button>
            <button
              onClick={runAnalysis}
              disabled={running || !parsedFile || brief.length < 20}
              className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${
                running || !parsedFile || brief.length < 20
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] shadow-sm"
              }`}
            >
              {running ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <BarChart3 className="w-4 h-4" />
              )}
              {running ? "Running…" : "Run Analysis"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function IntakePage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    }>
      <IntakeInner />
    </Suspense>
  );
}
