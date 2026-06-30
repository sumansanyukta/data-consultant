import type { ReactNode } from "react";

type BadgeVariant = "muted" | "accent" | "success" | "warning" | "danger";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
}

const styles: Record<BadgeVariant, string> = {
  muted: "bg-muted text-muted-foreground",
  accent: "bg-accent text-accent-foreground",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-red-50 text-red-700",
};

export function Badge({ children, variant = "muted" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full font-mono tracking-wide ${styles[variant]}`}
    >
      {children}
    </span>
  );
}
