"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Plus, FileClock, Database } from "lucide-react";

const NAV_ITEMS = [
  { id: "/", label: "Dashboard", icon: LayoutDashboard },
  { id: "/history", label: "Client History", icon: FileClock },
  { id: "/new-session", label: "New Session", icon: Plus },
] as const;

const CLIENTS = [
  { id: "c1", name: "Berliner Volksbank AG", initial: "B" },
  { id: "c2", name: "Siemens Energy GmbH", initial: "S" },
  { id: "c3", name: "BVG Berliner Verkehrsbetriebe", initial: "B" },
  { id: "c4", name: "Zalando SE", initial: "Z" },
];

export function Sidebar() {
  const pathname = usePathname();

  const isNavActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href === "/history") return pathname.startsWith("/history");
    return pathname.startsWith("/" + href.split("/")[1]);
  };

  return (
    <aside className="w-[220px] flex-shrink-0 bg-card border-r border-border flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 pt-7 pb-6 border-b border-border">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <Database className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-foreground leading-none">
              Pandata
            </p>
            <p className="text-[10px] text-muted-foreground font-mono mt-0.5 leading-none">
              Insight Desk
            </p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 pt-4 space-y-0.5">
        <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase font-mono px-2 mb-2">
          Workspace
        </p>
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const active = isNavActive(id);
          return (
            <Link
              key={id}
              href={id}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[13.5px] font-medium transition-all duration-150 group
                ${active
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
            >
              <Icon
                className={`w-4 h-4 flex-shrink-0 transition-colors ${
                  active
                    ? "text-primary"
                    : "text-muted-foreground group-hover:text-foreground"
                }`}
              />
              {label}
            </Link>
          );
        })}

        <div className="pt-4 pb-2">
          <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase font-mono px-2 mb-2">
            Clients
          </p>
          {CLIENTS.map((c) => (
            <Link
              key={c.id}
              href="/history"
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-[12.5px] text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-150"
            >
              <div className="w-5 h-5 rounded-md bg-secondary flex items-center justify-center flex-shrink-0 text-[10px] font-semibold text-muted-foreground">
                {c.initial}
              </div>
              <span className="truncate">{c.name.split(" ")[0]}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* User */}
      <div className="border-t border-border px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
            <span className="text-[12px] font-semibold text-foreground">LF</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12.5px] font-medium text-foreground truncate">
              Lena Fischer
            </p>
            <p className="text-[11px] text-muted-foreground truncate">
              Senior Consultant
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
