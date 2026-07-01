import Papa from "papaparse";
import type { FileProfile } from "./types";

// ── Types ──

export interface CorrelationPair {
  colA: string;
  colB: string;
  r: number;
}

export interface DistributionBin {
  col: string;
  binStart: number;
  binEnd: number;
  count: number;
}

export interface TopValue {
  col: string;
  value: string;
  count: number;
}

export interface OutlierEntry {
  col: string;
  value: number;
  row: number;
}

export interface ComputedStats {
  correlations: CorrelationPair[];
  distributions: DistributionBin[];
  topValues: TopValue[];
  outliers: OutlierEntry[];
}

// ── Helpers ──

function mean(values: number[]): number {
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function pearson(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 3) return 0;
  const mx = mean(x);
  const my = mean(y);
  let num = 0, sx = 0, sy = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - mx;
    const dy = y[i] - my;
    num += dx * dy;
    sx += dx * dx;
    sy += dy * dy;
  }
  const denom = Math.sqrt(sx * sy);
  return denom === 0 ? 0 : Math.round((num / denom) * 1000) / 1000;
}

function percentile(sorted: number[], p: number): number {
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

function computeBins(values: number[], col: string): DistributionBin[] {
  const valid = values.filter((v) => v != null && !isNaN(v));
  if (valid.length < 3) return [];
  const min = Math.min(...valid);
  const max = Math.max(...valid);
  if (min === max) return [{ col, binStart: min, binEnd: max, count: valid.length }];
  const binCount = Math.min(10, Math.ceil(Math.sqrt(valid.length)));
  const binWidth = (max - min) / binCount;
  const bins: DistributionBin[] = [];
  for (let i = 0; i < binCount; i++) {
    const start = min + i * binWidth;
    const end = i === binCount - 1 ? max : min + (i + 1) * binWidth;
    const count = valid.filter((v) => v >= start && v < end).length;
    bins.push({ col, binStart: Math.round(start * 100) / 100, binEnd: Math.round(end * 100) / 100, count });
  }
  // Merge last bin edge case
  if (bins.length > 0) {
    const last = bins[bins.length - 1];
    last.count += valid.filter((v) => v === last.binEnd).length;
  }
  return bins;
}

// ── Main ──

export function computeStats(csvContent: string, profile: FileProfile): ComputedStats {
  const result = Papa.parse(csvContent, { header: true, skipEmptyLines: true });
  const rows = result.data as Record<string, unknown>[];

  const numericCols = profile.columns.filter((c) => c.dtype === "numeric").map((c) => c.name);
  const textCols = profile.columns.filter((c) => c.dtype === "text").map((c) => c.name);

  // Extract numeric values
  const numValues: Record<string, number[]> = {};
  for (const col of numericCols) {
    numValues[col] = rows
      .map((r) => Number(r[col]))
      .filter((v) => !isNaN(v));
  }

  // Correlations
  const correlations: CorrelationPair[] = [];
  for (let i = 0; i < numericCols.length; i++) {
    for (let j = i + 1; j < numericCols.length; j++) {
      const r = pearson(numValues[numericCols[i]], numValues[numericCols[j]]);
      if (!isNaN(r) && Math.abs(r) > 0.1) {
        correlations.push({ colA: numericCols[i], colB: numericCols[j], r });
      }
    }
  }
  correlations.sort((a, b) => Math.abs(b.r) - Math.abs(a.r));

  // Distributions
  const distributions: DistributionBin[] = [];
  for (const col of numericCols) {
    distributions.push(...computeBins(numValues[col], col));
  }

  // Top values (text columns)
  const topValues: TopValue[] = [];
  for (const col of textCols) {
    const freq: Record<string, number> = {};
    for (const r of rows) {
      const v = String(r[col] ?? "").trim();
      if (v) freq[v] = (freq[v] ?? 0) + 1;
    }
    const sorted = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
    for (const [value, count] of sorted) {
      topValues.push({ col, value: value.slice(0, 50), count });
    }
  }

  // Outliers (IQR method)
  const outliers: OutlierEntry[] = [];
  for (const col of numericCols) {
    const vals = numValues[col];
    if (vals.length < 10) continue;
    const sorted = [...vals].sort((a, b) => a - b);
    const q1 = percentile(sorted, 0.25);
    const q3 = percentile(sorted, 0.75);
    const iqr = q3 - q1;
    const lower = q1 - 1.5 * iqr;
    const upper = q3 + 1.5 * iqr;
    for (let rowIdx = 0; rowIdx < vals.length; rowIdx++) {
      const v = vals[rowIdx];
      if (v < lower || v > upper) {
        outliers.push({ col, value: v, row: rowIdx });
      }
    }
  }
  outliers.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

  return { correlations, distributions, topValues, outliers };
}
