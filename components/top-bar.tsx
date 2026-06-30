"use client";

import { usePathname } from "next/navigation";
import { FlowProgress } from "@/components/flow-progress";

const WORKFLOW_ROUTES = ["/new-session", "/intake", "/analysis-running", "/results", "/finalize"];

const breadcrumbLabels: Record<string, string> = {
  "/": "Overview · All clients",
  "/history": "History · All sessions",
  "/session-detail": "Session · BVG Ridership Decline Q1–Q2 2024",
};

export function TopBar() {
  const pathname = usePathname();
  const inWorkflow = WORKFLOW_ROUTES.includes(pathname);

  // Extract the flow step from the path (remove leading /)
  const flowStep = pathname.replace("/", "") as
    | "new-session"
    | "intake"
    | "analysis-running"
    | "results"
    | "finalize";

  return (
    <header className="flex-shrink-0 bg-background border-b border-border px-7 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        {inWorkflow ? (
          <FlowProgress current={flowStep} />
        ) : (
          <p className="text-xs font-mono text-muted-foreground">
            {breadcrumbLabels[pathname] || ""}
          </p>
        )}
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
        <span>Mon 29 Jun 2026</span>
        <div className="w-px h-3 bg-border" />
        <span className="text-foreground">Pandata Berlin GmbH</span>
      </div>
    </header>
  );
}
