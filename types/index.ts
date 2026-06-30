export interface Client {
  id: string;
  name: string;
  sector: string;
  sessions: number;
  lastActive: string;
  createdAt: string;
}

export interface Session {
  id: string;
  clientId: string;
  title: string;
  status: "draft" | "complete";
  analysisType: string[];
  consultant: string;
  confidence: number;
  date: string;
  goal: string;
  summary: string;
  createdAt: string;
}

export interface DataFile {
  fileName: string;
  fileType: "csv" | "xlsx" | "json";
  fileUrl?: string;
  rowCount?: number;
  columnCount?: number;
  sizeKb?: number;
  columns: string[];
  dtypes: Record<string, string>;
  nullPct: Record<string, number>;
  sample: Record<string, unknown>[];
}

export interface SessionInput {
  id: string;
  sessionId: string;
  briefText: string;
  businessGoal: string;
  constraints: string;
  dataFiles: DataFile[];
  createdAt: string;
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

export interface SessionOutput {
  id: string;
  sessionId: string;
  execSummary: string;
  keySignals: string[];
  dataQualityFlags: DataQualityFlag[];
  recommendedAnalyses: RecommendedAnalysis[];
  followUpQuestions: string[];
  assumptions: string[];
  confidenceScore: number;
  dataCompleteness: number;
  createdAt: string;
}

export interface ConsultantNote {
  id: string;
  sessionId: string;
  noteText: string;
  createdAt: string;
}

export interface PipelineResult {
  execSummary: string;
  keySignals: string[];
  dataQualityFlags: DataQualityFlag[];
  recommendedAnalyses: RecommendedAnalysis[];
  followUpQuestions: string[];
  assumptions: string[];
  confidenceScore: number;
  dataCompleteness: number;
}
