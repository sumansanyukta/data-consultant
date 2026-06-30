import { Check, ChevronRight } from "lucide-react";

const FLOW_STEPS = [
  { id: "new-session", label: "Setup" },
  { id: "intake", label: "Brief & Data" },
  { id: "analysis-running", label: "Analysis" },
  { id: "results", label: "Results" },
  { id: "finalize", label: "Finalise" },
] as const;

export type FlowStep = (typeof FLOW_STEPS)[number]["id"];

export function FlowProgress({ current }: { current: FlowStep }) {
  const idx = FLOW_STEPS.findIndex((s) => s.id === current);
  if (idx === -1) return null;

  return (
    <div className="flex items-center gap-1 text-[12px]">
      {FLOW_STEPS.map((step, i) => {
        const done = i < idx;
        const active = i === idx;
        return (
          <div key={step.id} className="flex items-center gap-1">
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-all ${
                active
                  ? "bg-accent text-accent-foreground font-medium"
                  : done
                  ? "text-emerald-600"
                  : "text-muted-foreground"
              }`}
            >
              {done && <Check className="w-3 h-3" />}
              <span>{step.label}</span>
            </div>
            {i < FLOW_STEPS.length - 1 && (
              <ChevronRight className="w-3 h-3 text-muted-foreground/50" />
            )}
          </div>
        );
      })}
    </div>
  );
}
