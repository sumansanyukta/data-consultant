export interface Client {
  id: string;
  name: string;
  sector: string;
  sessions: number;
  lastActive: string;
}

export interface SessionSummary {
  id: string;
  clientName: string;
  title: string;
  date: string;
  consultant: string;
  confidence: number;
  status: "complete" | "draft";
  goal: string;
  summary: string;
}

export const CLIENTS: Client[] = [
  { id: "c1", name: "Berliner Volksbank AG", sector: "Financial Services", sessions: 7, lastActive: "3 days ago" },
  { id: "c2", name: "Siemens Energy GmbH", sector: "Energy / Industrial", sessions: 4, lastActive: "1 week ago" },
  { id: "c3", name: "BVG Berliner Verkehrsbetriebe", sector: "Public Transport", sessions: 11, lastActive: "Today" },
  { id: "c4", name: "Zalando SE", sector: "E-Commerce / Retail", sessions: 3, lastActive: "2 weeks ago" },
  { id: "c5", name: "Charité Universitätsmedizin", sector: "Healthcare", sessions: 2, lastActive: "1 month ago" },
];

export const RECENT_SESSIONS: SessionSummary[] = [
  {
    id: "s1", clientName: "BVG Berliner Verkehrsbetriebe", title: "Ridership Decline Q1–Q2 2024",
    date: "29 Jun 2026", consultant: "Lena Fischer", confidence: 82, status: "complete",
    goal: "Identify operational drivers of 14% ridership drop",
    summary: "Analysis identified three primary drivers: route coverage gaps in Lichtenberg district, increased cycle infrastructure competing for short-trip journeys, and fare structure friction for occasional users.",
  },
  {
    id: "s2", clientName: "Berliner Volksbank AG", title: "SME Credit Portfolio Risk Exposure",
    date: "27 Jun 2026", consultant: "Max Brauer", confidence: 74, status: "complete",
    goal: "Quantify tail risk in SME lending book",
    summary: "Credit quality segmentation revealed elevated risk concentration in hospitality sector (23% of book). Three data quality gaps identified in collateral valuation fields.",
  },
  {
    id: "s3", clientName: "Siemens Energy GmbH", title: "Field Service Efficiency Baseline",
    date: "22 Jun 2026", consultant: "Sophia Kern", confidence: 61, status: "draft",
    goal: "Benchmark technician dispatch efficiency",
    summary: "Preliminary analysis — data completeness at 61%. Missing GPS telemetry for 38% of service events. Recommend re-ingestion with full job record export before proceeding.",
  },
  {
    id: "s4", clientName: "Zalando SE", title: "Returns Attribution Model — Spring Collection",
    date: "18 Jun 2026", consultant: "Lena Fischer", confidence: 88, status: "complete",
    goal: "Attribute returns to size/fit vs. quality vs. impulse purchase segments",
    summary: "Size & fit accounts for 54% of returns. Recommendation: invest in improved size guidance tooling for footwear category specifically.",
  },
];
