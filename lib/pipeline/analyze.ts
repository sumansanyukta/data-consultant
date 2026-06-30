import type { ColumnProfile, FileProfile, DataQualityFlag, RecommendedAnalysis, PipelineOutput } from "./types";

const REVENUE_PATTERN = /revenue|sales|amount|cost|price|fee|charge|value|margin|profit|income/i;
const COUNT_PATTERN = /count|volume|quantity|units?|qty|num|total|sum|frequency/i;
const SEGMENT_PATTERN = /segment|group|category|type|class|tier|region|zone|channel|bucket|department|division/i;
const DATE_PATTERN = /date|time|timestamp|created|updated|year|month|day|period|quarter/i;
const ID_PATTERN = /^id$|_id$|^uuid$|^key$|^pk$|code|reference/i;
const RATING_PATTERN = /rating|score|rank|grade|percentile|satisfaction|nps/i;
const GEO_PATTERN = /lat|lon|longitude|latitude|address|city|state|country|postal|zip/i;
const TEXT_PATTERN = /name|title|description|comment|note|text|message|feedback/i;

function findColumns(pattern: RegExp, columns: ColumnProfile[]): ColumnProfile[] {
  return columns.filter((c) => pattern.test(c.name));
}

function hasDateColumn(columns: ColumnProfile[]): boolean {
  return columns.some((c) => c.dtype === "date") || findColumns(DATE_PATTERN, columns).length > 0;
}

function buildKeySignals(
  profile: FileProfile,
  qualityFlags: DataQualityFlag[],
): string[] {
  const signals: string[] = [];
  const { columns, rowCount } = profile;

  // Dataset size
  if (rowCount > 10000) {
    signals.push(`Large dataset (${rowCount.toLocaleString()} rows) — sufficient for robust statistical analysis`);
  } else if (rowCount < 100) {
    signals.push(`Small dataset (${rowCount} rows) — findings should be treated as indicative rather than conclusive`);
  } else {
    signals.push(`Dataset contains ${rowCount.toLocaleString()} rows across ${columns.length} columns`);
  }

  // Numeric columns
  const numericCols = columns.filter((c) => c.dtype === "numeric");
  const revenueCols = findColumns(REVENUE_PATTERN, numericCols);
  const countCols = findColumns(COUNT_PATTERN, numericCols);

  if (revenueCols.length > 0) {
    signals.push(`Financial metrics detected (${revenueCols.map((c) => c.name).join(", ")}) — profitability and revenue analysis possible`);
  }
  if (countCols.length > 0) {
    signals.push(`Volume/count data available (${countCols.map((c) => c.name).join(", ")}) — suitable for trend and frequency analysis`);
  }

  // Date/time
  const dateCols = columns.filter((c) => c.dtype === "date");
  const dateNamedCols = findColumns(DATE_PATTERN, columns);
  if (dateCols.length > 0 || dateNamedCols.length > 0) {
    signals.push("Temporal dimension available — time-series and trend analysis possible");
  }

  // Categorical / segmentation
  const textCols = columns.filter((c) => c.dtype === "text");
  const segmentCols = findColumns(SEGMENT_PATTERN, textCols);
  if (segmentCols.length > 0) {
    signals.push(`Categorical segmentation available (${segmentCols.map((c) => c.name).join(", ")}) — cohort and group comparison possible`);
  }

  // Data quality flags
  const dangerFlags = qualityFlags.filter((f) => f.severity === "danger");
  if (dangerFlags.length > 0) {
    signals.push(`${dangerFlags.length} critical data quality issue${dangerFlags.length > 1 ? "s" : ""} detected — review before proceeding`);
  }

  // High null columns
  const highNull = columns.filter((c) => c.nullPct > 20 && c.nullPct < 100);
  if (highNull.length > 0) {
    signals.push(`${highNull.length} column${highNull.length > 1 ? "s have" : " has"} >20% missing data — consider imputation strategy`);
  }

  return signals;
}

function buildRecommendedAnalyses(
  profile: FileProfile,
  qualityFlags: DataQualityFlag[],
): RecommendedAnalysis[] {
  const analyses: RecommendedAnalysis[] = [];
  const { columns } = profile;
  const numericCols = columns.filter((c) => c.dtype === "numeric");
  const textCols = columns.filter((c) => c.dtype === "text");
  const hasDate = hasDateColumn(columns);

  // Time-series
  if (hasDate && numericCols.length > 0) {
    analyses.push({
      title: "Temporal Trend Analysis",
      confidence: Math.min(85, numericCols.length * 10 + 60),
      desc: `Analyse ${numericCols[0].name} over time to identify trends, seasonality, and structural breaks`,
      tags: ["Time series", "Trend"],
    });
  }

  // Segmentation
  const segmentCols = findColumns(SEGMENT_PATTERN, textCols);
  if (segmentCols.length > 0 && numericCols.length > 0) {
    analyses.push({
      title: `Segmentation Analysis by ${segmentCols[0].name}`,
      confidence: Math.min(85, segmentCols.length * 10 + 65),
      desc: `Compare ${numericCols[0].name} across ${segmentCols[0].name} segments to identify high-performing and underperforming groups`,
      tags: ["Segmentation", "Comparison"],
    });
  }

  // Financial / profitability
  const revenueCols = findColumns(REVENUE_PATTERN, numericCols);
  const countCols = findColumns(COUNT_PATTERN, numericCols);
  if (revenueCols.length >= 1 && countCols.length >= 1) {
    analyses.push({
      title: "Unit Economics & Profitability Analysis",
      confidence: 78,
      desc: `Combine ${revenueCols[0].name} and ${countCols[0].name} to compute per-unit metrics and identify margin drivers`,
      tags: ["Financial", "Profitability"],
    });
  }

  // Correlation
  if (numericCols.length >= 3) {
    analyses.push({
      title: "Cross-Metric Correlation Analysis",
      confidence: Math.min(80, numericCols.length * 5 + 60),
      desc: `Examine relationships among ${numericCols.length} numeric variables to identify drivers, collinearity, and leading indicators`,
      tags: ["Correlation", "Exploratory"],
    });
  }

  // Categorical distribution
  if (textCols.length > 0 && textCols.length <= 5) {
    const ordered = [...textCols].sort((a, b) => a.uniqueCount - b.uniqueCount);
    const lowCardinality = ordered.filter((c) => c.uniqueCount <= 20);
    if (lowCardinality.length > 0) {
      analyses.push({
        title: "Categorical Distribution Profiling",
        confidence: 72,
        desc: `Profile value distributions for ${lowCardinality.map((c) => c.name).join(", ")} — identify dominant categories, rare groups, and balance`,
        tags: ["Distribution", "Profiling"],
      });
    }
  }

  // High nulls → data quality deep dive
  const highNullCols = columns.filter((c) => c.nullPct > 20 && c.nullPct < 100);
  if (highNullCols.length > 0) {
    analyses.push({
      title: "Missing Data Pattern Analysis",
      confidence: 65,
      desc: `Analyse missingness patterns across ${highNullCols.map((c) => c.name).join(", ")} — determine if nulls are random or systematic`,
      tags: ["Data quality", "Robustness"],
    });
  }

  // Predictive
  if (numericCols.length >= 4 && profile.rowCount > 500) {
    analyses.push({
      title: "Predictive Baseline Model",
      confidence: Math.min(75, numericCols.length * 8 + 40),
      desc: `Build a baseline predictive model using ${numericCols.slice(0, 3).map((c) => c.name).join(", ")} as potential predictors`,
      tags: ["Predictive", "ML"],
    });
  }

  // Rating/score analysis
  const ratingCols = findColumns(RATING_PATTERN, numericCols);
  if (ratingCols.length > 0) {
    analyses.push({
      title: "Satisfaction / Score Distribution Analysis",
      confidence: 76,
      desc: `Analyse distribution and drivers of ${ratingCols.map((c) => c.name).join(", ")} — identify ceiling/floor effects and segment differences`,
      tags: ["Score", "Distribution"],
    });
  }

  return analyses;
}

function computeConfidenceScore(profile: FileProfile, qualityFlags: DataQualityFlag[]): number {
  let score = 85;

  // Penalise for small datasets
  if (profile.rowCount < 100) score -= 20;
  else if (profile.rowCount < 1000) score -= 10;
  else if (profile.rowCount < 5000) score -= 5;

  // Penalise for too few columns
  if (profile.columnCount < 3) score -= 15;
  else if (profile.columnCount < 5) score -= 5;

  // Reward for more columns (rich data)
  if (profile.columnCount >= 15) score += 5;
  if (profile.columnCount >= 25) score += 3;

  // Penalise for danger flags
  const dangerCount = qualityFlags.filter((f) => f.severity === "danger").length;
  score -= dangerCount * 8;

  // Penalise for warning flags
  const warningCount = qualityFlags.filter((f) => f.severity === "warning").length;
  score -= warningCount * 3;

  // Penalise for high overall null rate
  const avgNulls = profile.columns.reduce((s, c) => s + c.nullPct, 0) / profile.columns.length;
  if (avgNulls > 20) score -= 10;
  else if (avgNulls > 10) score -= 5;

  return Math.max(0, Math.min(100, score));
}

function computeDataCompleteness(profile: FileProfile): number {
  if (profile.columns.length === 0) return 0;
  const avgCompleteness = profile.columns.reduce((s, c) => s + (100 - c.nullPct), 0) / profile.columns.length;
  return Math.round(avgCompleteness);
}

function buildFollowUpQuestions(
  profile: FileProfile,
  qualityFlags: DataQualityFlag[],
): string[] {
  const questions: string[] = [];
  const { columns, rowCount } = profile;

  const highNullCols = columns.filter((c) => c.nullPct > 20 && c.nullPct < 100);
  if (highNullCols.length > 0) {
    questions.push(`Can the missing data in ${highNullCols.map((c) => c.name).join(", ")} be obtained or reliably imputed?`);
  }

  const numericCols = columns.filter((c) => c.dtype === "numeric");
  if (numericCols.some((c) => c.min != null && c.min < 0)) {
    questions.push("What explains the negative values in numeric fields — data errors, refunds, or adjustments?");
  }

  if (!hasDateColumn(columns)) {
    questions.push("Is there a time dimension available (e.g. date, period, or timestamp) to enable trend analysis?");
  }

  const textCols = columns.filter((c) => c.dtype === "text");
  const highCardinality = textCols.filter((c) => c.uniqueCount > rowCount * 0.5 && c.uniqueCount > 20);
  for (const col of highCardinality) {
    if (!ID_PATTERN.test(col.name)) {
      questions.push(`What do the ${col.uniqueCount} unique values in "${col.name}" represent — are they categorical, free text, or identifiers?`);
    }
  }

  const segmentCols = findColumns(SEGMENT_PATTERN, textCols);
  if (segmentCols.length > 0 && segmentCols.some((c) => c.nullPct > 5)) {
    questions.push(`Are the segment definitions (${segmentCols.map((c) => c.name).join(", ")}) stable across the observation period?`);
  }

  if (rowCount < 500) {
    questions.push("Is the available data a complete extract or a sample of a larger dataset?");
  }

  return questions;
}

function buildAssumptions(profile: FileProfile): string[] {
  const assumptions: string[] = [];
  const { columns } = profile;

  const dateCols = columns.filter((c) => c.dtype === "date");
  if (dateCols.length === 0 && findColumns(DATE_PATTERN, columns).length === 0) {
    assumptions.push("No temporal dimension identified — analysis will be cross-sectional unless a date field is added");
  }

  const highNullCols = columns.filter((c) => c.nullPct > 20 && c.nullPct < 100);
  if (highNullCols.length === 0) {
    assumptions.push("Missing data is assumed to be below 20% across all columns — no imputation applied without further review");
  }

  const numericCols = columns.filter((c) => c.dtype === "numeric");
  if (numericCols.some((c) => c.min != null && c.min < 0)) {
    assumptions.push("Negative values in numeric fields are assumed to be valid unless identified as errors in review");
  }

  const textCols = columns.filter((c) => c.dtype === "text");
  for (const col of textCols) {
    if (col.uniqueCount <= 10 && col.nullPct < 5) {
      assumptions.push(`"${col.name}" treated as a categorical variable with ${col.uniqueCount} categories`);
    }
  }

  if (columns.length > 20) {
    assumptions.push(`Analysis scope limited to ${columns.length} columns — column selection or dimensionality reduction may be needed`);
  }

  return assumptions;
}

function buildExecSummary(
  profile: FileProfile,
  signals: string[],
  qualityFlags: DataQualityFlag[],
  confidence: number,
  businessGoal?: string,
): string {
  const { rowCount, columnCount, fileName } = profile;
  const dangerCount = qualityFlags.filter((f) => f.severity === "danger").length;
  const warningCount = qualityFlags.filter((f) => f.severity === "warning").length;

  const goalOpeners: Record<string, string> = {
    diagnostic: "This diagnostic analysis was conducted to identify root causes and explain observed patterns in the data. ",
    descriptive: "This descriptive analysis provides a structured overview of the dataset to establish a factual baseline for decision-making. ",
    predictive: "This predictive assessment examines historical patterns to estimate future outcomes and identify forward-looking signals. ",
    prescriptive: "This prescriptive evaluation explores the data to recommend actions and quantify expected impact of potential interventions. ",
  };

  let summary = goalOpeners[businessGoal ?? ""] ?? "";
  summary += `The examination of "${fileName}" covered ${rowCount.toLocaleString()} rows across ${columnCount} columns. `;

  if (dangerCount > 0) {
    summary += `${dangerCount} critical data quality ${dangerCount === 1 ? "issue was" : "issues were"} identified that should be reviewed before proceeding. `;
  }

  if (signals.length > 0) {
    summary += `Key findings: ${signals.slice(0, 2).join(". ")}. `;
  }

  summary += `Overall analysis confidence is ${confidence}/100 based on data completeness, column richness, and quality assessment.`;

  if (warningCount > 0) {
    summary += ` ${warningCount} additional ${warningCount === 1 ? "issue was" : "issues were"} flagged as warnings — review the quality report for details.`;
  }

  return summary;
}

export function analyze(
  profile: FileProfile,
  qualityFlags: DataQualityFlag[],
  briefText?: string,
  businessGoal?: string,
): PipelineOutput {
  const keySignals = buildKeySignals(profile, qualityFlags);
  const recommendedAnalyses = buildRecommendedAnalyses(profile, qualityFlags);
  const confidenceScore = computeConfidenceScore(profile, qualityFlags);
  const dataCompleteness = computeDataCompleteness(profile);
  const followUpQuestions = buildFollowUpQuestions(profile, qualityFlags);
  const assumptions = buildAssumptions(profile);
  const execSummary = buildExecSummary(profile, keySignals, qualityFlags, confidenceScore, businessGoal);

  return {
    execSummary,
    keySignals,
    dataCompleteness,
    confidenceScore,
    dataQualityFlags: qualityFlags,
    recommendedAnalyses,
    followUpQuestions,
    assumptions,
  };
}
