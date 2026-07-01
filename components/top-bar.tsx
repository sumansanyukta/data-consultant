"use client";

import { usePathname } from "next/navigation";

const STEP_LABELS: Record<string, string> = {
  "/new-session": "New session",
  "/intake": "Brief & data",
  "/analysis-running": "Processing",
  "/results": "Results",
  "/next-steps": "Next steps",
};

const BREADCRUMBS: Record<string, string> = {
  "/": "Dashboard",
  "/history": "Client history",
  "/session-detail": "Session detail",
};

export function TopBar() {
  const pathname = usePathname();
  const stepLabel = STEP_LABELS[pathname];
  const breadcrumb = BREADCRUMBS[pathname];

  return (
    <header className="flex-shrink-0 bg-background border-b border-border px-8 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {stepLabel ? (
          <div className="flex items-center gap-2 text-xs">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span className="font-mono text-muted-foreground tracking-wide">{stepLabel}</span>
          </div>
        ) : breadcrumb ? (
          <span className="text-xs font-mono text-muted-foreground tracking-wide">{breadcrumb}</span>
        ) : null}
      </div>
      <div className="text-xs font-mono text-muted-foreground tracking-wide">
        {new Date().toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}
      </div>
    </header>
  );
}
