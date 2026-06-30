import type { ColumnProfile, FileProfile, DataQualityFlag } from "./types";

const ID_COL_PATTERNS = /^id$|_id$|^uuid$|^key$|^pk$/i;
const COUNT_COL_PATTERNS = /count|volume|quantity|units?|qty|num|total|sum/i;
const REVENUE_COL_PATTERNS = /revenue|sales|amount|cost|price|fee|charge|value|margin|profit/i;
const DATE_COL_PATTERNS = /date|time|timestamp|created|updated|year|month|day/i;
const SEGMENT_COL_PATTERNS = /segment|group|category|type|class|tier|region|zone|channel|bucket/i;

export function checkQuality(profile: FileProfile, briefText?: string): DataQualityFlag[] {
  const flags: DataQualityFlag[] = [];

  for (const col of profile.columns) {
    // Null checks
    if (col.nullPct === 100) {
      flags.push({ severity: "danger", field: col.name, issue: `Column is entirely empty — all ${profile.rowCount} rows are null` });
    } else if (col.nullPct > 20) {
      flags.push({ severity: "danger", field: col.name, issue: `${col.nullPct}% missing values — may bias any analysis using this field` });
    } else if (col.nullPct > 5) {
      flags.push({ severity: "warning", field: col.name, issue: `${col.nullPct}% missing values — consider imputation or exclusion` });
    }

    // Numeric checks
    if (col.dtype === "numeric" && col.min != null) {
      if (COUNT_COL_PATTERNS.test(col.name) && col.min < 0) {
        flags.push({ severity: "danger", field: col.name, issue: `Negative values (min: ${col.min}) in a count/volume field — possible data entry error` });
      }
      if (col.max != null && col.min === col.max) {
        flags.push({ severity: "info", field: col.name, issue: `Zero variance — all values are identical (${col.min}). May be a constant or placeholder.` });
      }
      if (col.mean != null && col.median != null && col.mean > 0 && Math.abs(col.mean - col.median) / col.mean > 0.5) {
        flags.push({ severity: "info", field: col.name, issue: `Highly skewed distribution (mean ${col.mean} vs median ${col.median}) — consider log transform or non-parametric tests` });
      }
    }

    // ID column checks (high cardinality)
    if (ID_COL_PATTERNS.test(col.name)) {
      if (col.uniqueCount < profile.rowCount) {
        flags.push({ severity: "warning", field: col.name, issue: `ID column has ${profile.rowCount - col.uniqueCount} duplicate values — ${((1 - col.uniqueCount / profile.rowCount) * 100).toFixed(0)}% of rows` });
      }
    }

    // Date column gaps
    if (DATE_COL_PATTERNS.test(col.name) && col.dtype !== "date") {
      if (col.uniqueCount <= 1) {
        flags.push({ severity: "warning", field: col.name, issue: `Date-type field has only ${col.uniqueCount} unique value${col.uniqueCount === 1 ? "" : "s"} — may have wrong data type or be insufficiently granular` });
      } else if (col.uniqueCount < 10) {
        flags.push({ severity: "info", field: col.name, issue: `Date-type field has only ${col.uniqueCount} unique values — consider if granularity is adequate for trend analysis` });
      }
    }

    // High cardinality text (potential ID masquerading as text)
    if (col.dtype === "text" && col.uniqueCount > profile.rowCount * 0.8 && col.uniqueCount > 100) {
      flags.push({ severity: "info", field: col.name, issue: `Very high cardinality text (${col.uniqueCount} unique values) — could be a unique identifier or free text` });
    }

    // Segmentation fields
    if (SEGMENT_COL_PATTERNS.test(col.name) && col.uniqueCount > 50) {
      flags.push({ severity: "info", field: col.name, issue: `High cardinality segment field (${col.uniqueCount} groups) — consider grouping or filtering before analysis` });
    }
  }

  // Overall checks
  if (profile.rowCount < 100) {
    flags.push({ severity: "warning", field: "dataset", issue: `Small dataset (${profile.rowCount} rows) — statistical significance may be limited` });
  }

  // Brief-content alignment
  if (briefText) {
    const lower = briefText.toLowerCase();
    const COMMON_NAMES = new Set(["id", "name", "date", "type", "key", "code", "uuid", "pk", "url"]);
    const meaningful = profile.columns.filter(
      (c) => c.name.length >= 4 && !COMMON_NAMES.has(c.name.toLowerCase())
    );
    const mentioned = meaningful.filter((c) => {
      const pattern = c.name.toLowerCase().replace(/[_-]/g, " ");
      return pattern.length > 0 && lower.includes(pattern);
    });
    if (mentioned.length < 2 && meaningful.length > 2) {
      flags.push({ severity: "info", field: "brief", issue: "Few column names match the brief text — verify the uploaded data corresponds to the stated objective" });
    }
  }

  return flags;
}
