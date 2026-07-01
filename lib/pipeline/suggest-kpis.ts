import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import type { PipelineOutput } from "./types";
import type { ComputedStats } from "./stats";
import type { KpiSuggestion } from "@/types";

const SYSTEM_PROMPT = `You are a senior data consultant advising a client on which KPIs to track.

Based on the data analysis output, suggest 4-8 concrete, actionable KPIs the client should start tracking.

For each KPI provide:
- name: short display name (under 40 chars)
- description: one sentence explaining what it measures (under 80 chars)
- formula: how to calculate it, referencing actual column names from the data (under 100 chars)
- priority: "high", "medium", or "low" based on business impact and data availability

Rules:
- Only suggest KPIs that can actually be computed from the available columns
- Prioritise KPIs aligned with the business goal
- Make formulas specific (e.g. "SUM(revenue) / COUNT(orders)" not vague math)
- Return ONLY valid JSON with no markdown, no code fences, no extra text
- Use this exact shape:
  {"kpis":[{"name":"...","description":"...","formula":"...","priority":"high|medium|low"}]}`;

export async function suggestKPIs(
  output: PipelineOutput,
  stats: ComputedStats,
  profile: { columns: { name: string; dtype: string }[] },
  briefText?: string,
  businessGoal?: string,
): Promise<KpiSuggestion[]> {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    throw new Error("GEMINI_API_KEY not set");
  }

  const input = JSON.stringify({
    columns: profile.columns.map((c) => ({ name: c.name, dtype: c.dtype })),
    rowCount: profile.columns.length > 0 ? "sample rows available" : undefined,
    execSummary: output.execSummary.slice(0, 1500),
    keySignals: output.keySignals,
    dataCompleteness: output.dataCompleteness,
    confidenceScore: output.confidenceScore,
    recommendedAnalyses: output.recommendedAnalyses,
    correlations: stats.correlations.slice(0, 8),
    topValues: stats.topValues.slice(0, 12),
    outliers: stats.outliers.slice(0, 5),
    briefText: briefText?.slice(0, 1000),
    businessGoal,
  });

  const { text } = await generateText({
    model: google("gemini-2.0-flash-001"),
    system: SYSTEM_PROMPT,
    prompt: input,
    temperature: 0.3,
  });

  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("LLM returned unparseable KPI output: " + text.slice(0, 200));
    parsed = JSON.parse(match[0]);
  }

  return (parsed.kpis ?? []).filter(
    (k: any) => k.name && k.description && k.priority && ["high", "medium", "low"].includes(k.priority)
  );
}
