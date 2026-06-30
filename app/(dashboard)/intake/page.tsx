"use client";

import { Suspense, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronRight,
  Upload,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  X,
  FileText,
  Loader2,
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

function IntakeInner() {
  const router = useRouter();
  const [brief, setBrief] = useState("");

  const BRIEF_PRESETS = [
    {
      label: "I have data, not sure what to look for",
      text: "I have a dataset and I want to explore it to find useful insights. I'm looking for trends, outliers, patterns, or anything notable that could inform business decisions. A broad exploratory analysis would be helpful to understand what the data can tell us.",
    },
    {
      label: "Why is a metric changing?",
      text: "We've observed a significant change in a key metric over recent periods and need to understand the root cause. The data covers the relevant timeframe. We want to identify which factors are driving the change and quantify their relative contribution.",
    },
    {
      label: "Predict an outcome",
      text: "We have historical data on past outcomes and want to build a predictive view. The goal is to forecast future results based on the patterns in our data, so we can plan and allocate resources more effectively.",
    },
    {
      label: "Find patterns / segments",
      text: "We want to segment our data to identify distinct groups or patterns. The goal is to understand natural groupings in the data — whether by customer behaviour, operational performance, or other dimensions — so we can tailor strategies accordingly.",
    },
  ];
  const [goal, setGoal] = useState("diagnostic");
  const [parsedFile, setParsedFile] = useState<ParsedFile | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [csvContent, setCsvContent] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId") ?? crypto.randomUUID();

  const validations = [
    {
      label: "Brief length",
      ok: brief.length > 100,
      msg: brief.length > 100 ? `${brief.length} chars — sufficient detail` : "Add more context",
    },
    {
      label: "Business question",
      ok: /why|what|how|want to|goal/i.test(brief),
      msg: /why|what|how|want to|goal/i.test(brief) ? "Objective identified" : "No question or goal detected",
    },
    {
      label: "Data sample",
      ok: !!parsedFile,
      msg: parsedFile ? `${parsedFile.fileName} (${parsedFile.rowCount} rows, ${parsedFile.columnCount} cols)` : "Optional — add for richer analysis",
    },
  ];

  const handleFile = useCallback(async (file: File) => {
    setUploadError(null);
    setUploading(true);

    try {
      if (!file.name.endsWith(".csv") && !file.name.endsWith(".csv")) {
        setUploadError("Only CSV files are supported at this time");
        setUploading(false);
        return;
      }

      // Parse CSV on the client
      const text = await file.text();
      setCsvContent(text);
      const result = Papa.parse(text, { header: true, skipEmptyLines: true, preview: 100 });
      const headers = result.meta.fields ?? [];
      const sample = result.data as Record<string, unknown>[];

      // Compute row count from full file
      const fullResult = Papa.parse(text, { header: true, skipEmptyLines: true });
      const totalRows = fullResult.data.length;

      // Infer dtypes
      const rawDtypes: Record<string, string> = {};
      for (const col of headers) {
        rawDtypes[col] = inferDtype(sample.map((r) => r[col] as string | number | boolean | null | undefined));
      }

      // Null pct from full data sample (first 1000)
      const nullSample = (fullResult.data as Record<string, unknown>[]).slice(0, 1000);
      const nullPct: Record<string, number> = {};
      for (const col of headers) {
        nullPct[col] = computeNullPct(nullSample, col);
      }

      // Upload to Supabase Storage
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

  return (
    <div className="p-8">
      <div className="mb-7">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2 font-mono">
          <span className="text-foreground">New Session</span>
        </div>
        <h1
          className="text-2xl font-semibold text-foreground"
          style={{ fontFamily: "var(--font-lora), serif" }}
        >
          Brief & Data Intake
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Describe what you&apos;re looking for, upload your data, and define your analytical objective.
        </p>
      </div>

      <div className="grid grid-cols-5 gap-6">
        {/* Left: Brief + Goal */}
        <div className="col-span-3 space-y-5">
          <div className="bg-card border border-border rounded-[14px] p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase font-mono">
                Brief
              </p>
              {brief.length > 0 && (
                <button
                  onClick={() => setBrief("")}
                  className="text-[11px] font-mono text-muted-foreground hover:text-foreground transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
            {brief.length === 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {BRIEF_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => setBrief(preset.text)}
                    className="text-[11px] font-medium px-2.5 py-1.5 rounded-lg bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors border border-border"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            )}
            <textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              rows={10}
              placeholder={brief.length === 0 ? "Select a preset above, or paste your own brief here..." : ""}
              className="w-full bg-input-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none leading-relaxed"
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-[11px] text-muted-foreground font-mono">
                {brief.length} chars ·{" "}
                {brief.split(/\s+/).filter(Boolean).length} words
              </p>
              <span
                className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full font-mono tracking-wide ${
                  brief.length > 200
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {brief.length > 200 ? "Good depth" : "Add more"}
              </span>
            </div>
          </div>

          <div className="bg-card border border-border rounded-[14px] p-6">
            <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase font-mono mb-3">
              Analytical Objective
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              What type of analysis does this brief call for?
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { id: "diagnostic", label: "Diagnostic", desc: "Why did X happen?" },
                { id: "descriptive", label: "Descriptive", desc: "What is happening?" },
                { id: "predictive", label: "Predictive", desc: "What will happen?" },
                { id: "prescriptive", label: "Prescriptive", desc: "What should we do?" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setGoal(opt.id)}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    goal === opt.id
                      ? "border-primary/40 bg-accent"
                      : "border-border bg-muted/30 hover:border-border hover:bg-muted/60"
                  }`}
                >
                  <p
                    className={`text-xs font-semibold mb-0.5 ${
                      goal === opt.id ? "text-accent-foreground" : "text-foreground"
                    }`}
                  >
                    {opt.label}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Upload + Validation */}
        <div className="col-span-2 space-y-5">
          {/* File drop zone */}
          <div className="bg-card border border-border rounded-[14px] p-6">
            <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase font-mono mb-3">
              Data Sample
            </p>

            {parsedFile ? (
              <div className="space-y-3">
                <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-3.5">
                  <FileText className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {parsedFile.fileName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {parsedFile.rowCount.toLocaleString()} rows · {parsedFile.columnCount} columns · {parsedFile.sizeKb} KB
                    </p>
                  </div>
                  <button
                    onClick={removeFile}
                    className="flex-shrink-0 p-1 rounded-lg hover:bg-emerald-100 transition-colors"
                  >
                    <X className="w-4 h-4 text-emerald-600" />
                  </button>
                </div>

                <div className="bg-muted/50 rounded-lg p-3 overflow-x-auto">
                  <table className="text-[11px] font-mono w-full">
                    <thead>
                      <tr className="text-muted-foreground">
                        {parsedFile.columns.map((h) => (
                          <th key={h} className="text-left pr-4 pb-1.5 font-medium">
                            {h}
                            <span className="block text-[10px] text-muted-foreground/60 font-normal">
                              {parsedFile.rawDtypes[h]}
                            </span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="text-foreground">
                      {parsedFile.sample.map((row, i) => (
                        <tr key={i}>
                          {parsedFile.columns.map((col) => (
                            <td key={col} className="pr-4 py-0.5 text-foreground/80 truncate max-w-[120px]">
                              {String(row[col] ?? "")}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => document.getElementById("csv-upload")?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  dragOver
                    ? "border-primary bg-accent"
                    : "border-border hover:border-primary/40 hover:bg-muted/40"
                }`}
              >
                {uploading ? (
                  <div>
                    <Loader2 className="w-8 h-8 text-primary mx-auto mb-2 animate-spin" />
                    <p className="text-sm text-muted-foreground">Uploading and parsing...</p>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm font-medium text-foreground">
                      Drop CSV file
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      or click to browse · Max 50 MB
                    </p>
                  </div>
                )}
                <input
                  id="csv-upload"
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={onFileSelect}
                />
              </div>
            )}

            {uploadError && (
              <div className="mt-3 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-xs text-red-700">{uploadError}</p>
              </div>
            )}
          </div>

          {/* Intake Validation */}
          <div className="bg-card border border-border rounded-[14px] p-5">
            <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase font-mono mb-3">
              Intake Validation
            </p>
            <div className="space-y-2.5">
              {validations.map(({ label, ok, msg }) => (
                <div key={label} className="flex items-start gap-2.5">
                  {ok ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="text-xs font-medium text-foreground">{label}</p>
                    <p className="text-[11px] text-muted-foreground">{msg}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Run Analysis */}
          <button
            onClick={async () => {
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
              } catch (e: any) {
                console.error("Pipeline run failed", e);
                setRunning(false);
              }
            }}
            disabled={!parsedFile || !csvContent || running}
            className={`w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-colors shadow-sm ${
              parsedFile && csvContent && !running
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}
          >
            {running ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Run Analysis
              </>
            )}
          </button>
        </div>
      </div>
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
