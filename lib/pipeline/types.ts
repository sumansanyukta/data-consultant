export interface ColumnProfile {
  name: string;
  dtype: "numeric" | "text" | "date" | "unknown";
  nullPct: number;
  uniqueCount: number;
  min?: number;
  max?: number;
  mean?: number;
  median?: number;
  sampleValues: (string | number | null)[];
}

export interface FileProfile {
  fileName: string;
  rowCount: number;
  columnCount: number;
  sizeKb: number;
  columns: ColumnProfile[];
  sampleRows: Record<string, unknown>[];
  storagePath: string;
}

export interface DataQualityFlag {
  severity: "danger" | "warning" | "info";
  field: string;
  issue: string;
}

export interface RecommendedAnalysis {
  title: string;
  confidence: number;
  desc: string;
  tags: string[];
}

export interface PipelineOutput {
  execSummary: string;
  keySignals: string[];
  dataCompleteness: number;
  confidenceScore: number;
  dataQualityFlags: DataQualityFlag[];
  recommendedAnalyses: RecommendedAnalysis[];
  followUpQuestions: string[];
  assumptions: string[];
}
