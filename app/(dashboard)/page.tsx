import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1
            className="text-2xl font-semibold text-foreground"
            style={{ fontFamily: "var(--font-lora), serif" }}
          >
            Good morning, Lena.
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monday, 29 June 2026 · 3 active clients this week
          </p>
        </div>
        <Link
          href="/new-session"
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Start Analysis
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4 mb-7">
        {[
          { label: "Active Clients", value: "5", sub: "+1 this quarter" },
          { label: "Sessions This Month", value: "12", sub: "4 complete · 1 draft" },
          { label: "Avg. Confidence", value: "76%", sub: "Across all sessions" },
          { label: "Data Uploads", value: "18", sub: "CSV · Excel · JSON" },
        ].map(({ label, value, sub }) => (
          <div key={label} className="bg-card border border-border rounded-[14px] p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-1.5">
                  {label}
                </p>
                <p className="text-2xl font-semibold text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground mt-1">{sub}</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                <div className="w-4 h-4 rounded bg-muted-foreground/30" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main grid — asymmetric: 3 cols left, 2 cols right */}
      <div className="grid grid-cols-5 gap-5">
        {/* Recent Sessions — 3 cols */}
        <div className="col-span-3">
          <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase font-mono mb-3">
            Recent Sessions
          </p>
          <div className="bg-card border border-border rounded-[14px]">
            <div className="divide-y divide-border">
              {[
                {
                  id: "s1",
                  title: "Ridership Decline Q1–Q2 2024",
                  client: "BVG Berliner Verkehrsbetriebe",
                  consultant: "Lena Fischer",
                  confidence: 82,
                  status: "complete" as const,
                  date: "29 Jun 2026",
                },
                {
                  id: "s2",
                  title: "SME Credit Portfolio Risk Exposure",
                  client: "Berliner Volksbank AG",
                  consultant: "Max Brauer",
                  confidence: 74,
                  status: "complete" as const,
                  date: "27 Jun 2026",
                },
                {
                  id: "s3",
                  title: "Field Service Efficiency Baseline",
                  client: "Siemens Energy GmbH",
                  consultant: "Sophia Kern",
                  confidence: 61,
                  status: "draft" as const,
                  date: "22 Jun 2026",
                },
                {
                  id: "s4",
                  title: "Returns Attribution Model",
                  client: "Zalando SE",
                  consultant: "Lena Fischer",
                  confidence: 88,
                  status: "complete" as const,
                  date: "18 Jun 2026",
                },
              ].map((session) => (
                <div
                  key={session.id}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-muted/50 transition-colors first:rounded-t-[14px] last:rounded-b-[14px]"
                >
                  <div
                    className={`w-2 h-2 rounded-full flex-shrink-0 mt-0.5 ${
                      session.status === "complete"
                        ? "bg-emerald-500"
                        : "bg-amber-400"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-medium text-foreground truncate">
                        {session.title}
                      </p>
                      {session.status === "draft" && (
                        <span className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full font-mono tracking-wide bg-amber-50 text-amber-700">
                          Draft
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {session.client} · {session.consultant}
                    </p>
                  </div>
                  <div className="flex-shrink-0 w-32">
                    <div className="flex items-center gap-2.5">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            session.confidence >= 75
                              ? "bg-emerald-500"
                              : session.confidence >= 55
                              ? "bg-amber-500"
                              : "bg-red-400"
                          }`}
                          style={{ width: `${session.confidence}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono text-muted-foreground w-8 text-right">
                        {session.confidence}%
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground text-right mt-1">
                      {session.date}
                    </p>
                  </div>
                  <svg
                    className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column — 2 cols */}
        <div className="col-span-2 space-y-5">
          {/* Quick Start */}
          <div className="bg-card border border-border rounded-[14px] p-5 border-primary/20 bg-accent">
            <p className="text-[11px] font-semibold font-mono tracking-widest uppercase text-accent-foreground/70 mb-2">
              Quick Start
            </p>
            <h3
              className="text-base font-semibold text-foreground mb-1"
              style={{ fontFamily: "var(--font-lora), serif" }}
            >
              New analysis session
            </h3>
            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
              Paste a client brief, upload sample data, and generate a structured
              analytical starting point in minutes.
            </p>
            <Link
              href="/new-session"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-3.5 py-2 rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Begin Session
              <svg
                className="w-3.5 h-3.5 ml-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 12h14m-6-6l6 6-6 6"
                />
              </svg>
            </Link>
          </div>

          {/* Clients */}
          <div>
            <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase font-mono mb-3">
              Clients
            </p>
            <div className="bg-card border border-border rounded-[14px]">
              <div className="divide-y divide-border">
                {[
                  { name: "Berliner Volksbank AG", sector: "Financial Services", sessions: 7, active: "3 days ago" },
                  { name: "Siemens Energy GmbH", sector: "Energy", sessions: 4, active: "1 week ago" },
                  { name: "BVG Berliner Verkehrsbetriebe", sector: "Public Transport", sessions: 11, active: "Today" },
                  { name: "Zalando SE", sector: "E-Commerce", sessions: 3, active: "2 weeks ago" },
                ].map((client) => (
                  <div
                    key={client.name}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 text-[11px] font-semibold text-foreground">
                      {client.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">
                        {client.name.split(" ").slice(0, 2).join(" ")}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {client.sessions} sessions · {client.active}
                      </p>
                    </div>
                    <span className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full font-mono tracking-wide bg-muted text-muted-foreground">
                      {client.sector.split(" ")[0]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
