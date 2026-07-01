export function Logo({ size = "sm" }: { size?: "sm" | "md" | "lg" }) {
  const iconSize = size === "sm" ? 7 : size === "md" ? 10 : 14;
  const textSize = size === "sm" ? "text-[13px]" : size === "md" ? "text-base" : "text-xl";
  const subSize = size === "sm" ? "text-[10px]" : size === "md" ? "text-xs" : "text-sm";
  const gap = size === "sm" ? "gap-2.5" : "gap-3";

  return (
    <div className={`flex items-center ${gap}`}>
      <div
        className="relative flex items-center justify-center flex-shrink-0"
        style={{ width: iconSize * 4, height: iconSize * 4 }}
      >
        <svg viewBox="0 0 32 32" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 10C9 16 9 23 16 23C23 23 23 16 23 10" stroke="#C4622D" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="23" cy="7" r="2" fill="#C4622D" />
        </svg>
      </div>
      <div>
        <p className={`${textSize} font-semibold text-foreground leading-none tracking-tight`}>
          Unwritten
        </p>
        <p className={`${subSize} text-muted-foreground font-mono mt-0.5 leading-none tracking-wider uppercase`}>
          Data
        </p>
      </div>
    </div>
  );
}

export function LogoIcon({ size = 28 }: { size?: number }) {
  return (
    <div
      className="relative flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 32 32" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 10C9 16 9 23 16 23C23 23 23 16 23 10" stroke="#C4622D" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="23" cy="7" r="2" fill="#C4622D" />
      </svg>
    </div>
  );
}
