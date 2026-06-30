import Papa from "papaparse";
import type { ColumnProfile, FileProfile } from "./types";

function inferDtype(values: (string | null | undefined)[]): ColumnProfile["dtype"] {
  const nonNull = values.filter((v) => v != null && v !== "");
  if (nonNull.length === 0) return "unknown";
  const numeric = nonNull.filter((v) => !isNaN(Number(v)));
  if (numeric.length / nonNull.length > 0.8) return "numeric";
  const dates = nonNull.filter((v) => !isNaN(Date.parse(String(v))));
  if (dates.length / nonNull.length > 0.8) return "date";
  return "text";
}

function computeNullPct(values: (string | null | undefined)[]): number {
  if (values.length === 0) return 0;
  const nulls = values.filter((v) => v == null || v === "").length;
  return Math.round((nulls / values.length) * 100);
}

function uniqueCount(values: (string | null | undefined)[]): number {
  const set = new Set(values.filter((v) => v != null && v !== ""));
  return set.size;
}

function numericValues(values: (string | null | undefined)[]): number[] {
  return values
    .filter((v) => v != null && v !== "" && !isNaN(Number(v)))
    .map(Number);
}

export function profileCSV(
  content: string,
  fileName: string,
  storagePath: string
): FileProfile {
  const result = Papa.parse(content, { header: true, skipEmptyLines: true });
  const rows = result.data as Record<string, unknown>[];
  const headers = result.meta.fields ?? [];
  const rowCount = rows.length;

  const columns: ColumnProfile[] = headers.map((col) => {
    const rawValues = rows.map((r) => r[col] as string | null | undefined);

    const dtype = inferDtype(rawValues);
    const nullPct = computeNullPct(rawValues);
    const uniq = uniqueCount(rawValues);
    const sampleValues = rawValues
      .filter((v) => v != null && v !== "")
      .slice(0, 5)
      .map((v) => {
        if (dtype === "numeric") return Number(v);
        return v ?? null;
      });

    let min: number | undefined;
    let max: number | undefined;
    let mean: number | undefined;
    let median: number | undefined;

    if (dtype === "numeric") {
      const nums = numericValues(rawValues);
      if (nums.length > 0) {
        nums.sort((a, b) => a - b);
        min = nums[0];
        max = nums[nums.length - 1];
        mean = Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 100) / 100;
        const mid = Math.floor(nums.length / 2);
        median = nums.length % 2 === 0 ? (nums[mid - 1] + nums[mid]) / 2 : nums[mid];
      }
    }

    return { name: col, dtype, nullPct, uniqueCount: uniq, min, max, mean, median, sampleValues };
  });

  const sampleRows = rows.slice(0, 5);
  const sizeKb = Math.round(new Blob([content]).size / 1024);

  return { fileName, rowCount, columnCount: headers.length, sizeKb, columns, sampleRows, storagePath };
}
