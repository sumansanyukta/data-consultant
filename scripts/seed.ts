import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seed() {
  // Clients
  const { data: clients, error: ce } = await supabase
    .from("clients")
    .insert([
      { name: "Willow Creek Capital", sector: "Financial Services" },
      { name: "MedBridge Health", sector: "Healthcare" },
      { name: "Apex Retail Group", sector: "Retail" },
      { name: "Skyline Logistics", sector: "Transportation & Logistics" },
      { name: "NorthStar Energy", sector: "Energy" },
    ])
    .select();
  if (ce) throw ce;
  console.log("Clients:", clients.length);

  const sessions = [];
  const inputs = [];
  const outputs = [];

  for (const client of clients!) {
    for (let i = 0; i < 3; i++) {
      const isComplete = i < 2;
      const sessionId = crypto.randomUUID();

      const goal = [
        "Identify underperforming product lines and optimise pricing strategy",
        "Analyse customer churn patterns and recommend retention strategies",
        "Evaluate operational efficiency across regional distribution centres",
      ][i];

      sessions.push({
        id: sessionId,
        client_id: client.id,
        title: `Q${i + 1} 2025 Analysis`,
        status: isComplete ? "complete" : "draft",
        analysis_type: ["Trend Analysis", "Forecasting", "Operational Review"],
        consultant: ["Sarah Chen", "Marcus Webb", "Priya Patel"][i],
        confidence: isComplete ? [85, 72, 90][i] : 0,
        date: `2025-${String(i + 1).padStart(2, "0")}-15`,
        goal,
        summary: isComplete
          ? [
              "Analysis identified 3 underperforming SKUs contributing to 22% margin erosion. Pricing optimisation recommended.",
              "Churn rate at 8.3% with top 3 drivers identified: onboarding experience, billing friction, support wait times.",
              "Regional distribution analysis completed — West region operating at 74% efficiency vs 91% target.",
            ][i]
          : "",
      });

      inputs.push({
        session_id: sessionId,
        brief_text: `Brief text for ${client.name} session ${i + 1}`,
        business_goal: goal,
        constraints: "Data provided covers last 12 months only. Some fields have incomplete records.",
        data_files: [
          {
            fileName: `client_${client.name.toLowerCase().replace(/\s+/g, "_")}_q${i + 1}_2025.csv`,
            fileType: "csv",
            rowCount: 15000 + i * 5000,
            columnCount: 12 + i * 2,
            sizeKb: 2400 + i * 800,
            columns: ["date", "revenue", "cost", "volume", "region", "product_line", "channel", "customer_segment", "margin", "units_sold", "returns", "inventory_level"],
            dtypes: { date: "datetime64[ns]", revenue: "float64", cost: "float64", volume: "int64", region: "object", product_line: "object", channel: "object", customer_segment: "object", margin: "float64", units_sold: "int64", returns: "int64", inventory_level: "int64" },
            nullPct: { date: 0, revenue: 0.02, cost: 0.01, volume: 0, region: 0, product_line: 0, channel: 0.03, customer_segment: 0.05, margin: 0.02, units_sold: 0, returns: 0.08, inventory_level: 0 },
            sample: [
              { date: "2025-01-15", revenue: 45230, cost: 32100, volume: 1200, region: "East", product_line: "Premium", channel: "Direct", customer_segment: "Enterprise", margin: 0.29, units_sold: 1200, returns: 12, inventory_level: 3400 },
              { date: "2025-01-16", revenue: 38700, cost: 28900, volume: 980, region: "West", product_line: "Standard", channel: "Partner", customer_segment: "SMB", margin: 0.25, units_sold: 980, returns: 8, inventory_level: 2900 },
            ],
          },
        ],
      });

      if (isComplete) {
        outputs.push({
          session_id: sessionId,
          exec_summary: [
            "This analysis examined 12 months of sales data across 4 regions and 6 product lines. Three underperforming SKUs were identified, contributing to 22% of margin erosion. Pricing optimisation and SKU rationalisation are recommended.",
            "Customer churn analysis revealed an 8.3% monthly churn rate with onboarding experience, billing friction, and support wait times as top drivers. A targeted retention programme could reduce churn by 2.5 percentage points.",
            "Operational efficiency was evaluated across 5 regional distribution centres. The West region operates at 74% efficiency vs. the 91% target. Inventory turnover and pick/pack cycle times are key leverage points.",
          ][i],
          key_signals: [
            ['Premium product line margin declining 3.2% QoQ for 4 consecutive quarters', 'Return rate spiking to 8% in East region — 2x national average', 'Enterprise segment revenue flat despite 15% volume growth — price compression evident'],
            ['Churn rate peaks at month 3 (16.7%) — critical onboarding gap', 'Billing-related churn accounts for 34% of all churn events', 'Support wait times >5 min correlate with 40% higher churn probability'],
            ['West region pick/pack time 2.4x benchmark', 'Inventory turnover 4.2x in East vs 2.1x in West', 'OTIF rate dropping from 95% to 88% over 6 months'],
          ][i],
          data_quality_flags: [
            [{ severity: "danger", field: "returns", issue: "8% missing values in returns column — may undercount actual returns" }, { severity: "warning", field: "customer_segment", issue: "5% of records unclassified — likely SMB segment" }],
            [{ severity: "warning", field: "support_tickets", issue: "Ticket data only available for 9 of 12 months" }, { severity: "info", field: "customer_tenure", issue: "Tenure calculated from first purchase date — no account creation date available" }],
            [{ severity: "danger", field: "inventory_level", issue: "Inventory snapshots are end-of-month only — mid-month stockouts not captured" }, { severity: "warning", field: "cost_allocations", issue: "Overhead costs allocated evenly across regions — may distort efficiency metrics" }],
          ][i],
          recommended_analyses: [
            [{ title: "Price Elasticity Modelling", confidence: 82, desc: "Estimate optimal price points per product line to maximise revenue without volume loss", tags: ["pricing", "revenue", "elasticity"] }, { title: "SKU Rationalisation Framework", confidence: 90, desc: "Score each SKU on profitability, volume trend, and strategic fit to build discontinuation roadmap", tags: ["inventory", "profitability", "strategy"] }],
            [{ title: "Onboarding Flow Audit", confidence: 78, desc: "Map customer journey from sign-up to month 3, identifying drop-off points and friction areas", tags: ["onboarding", "retention", "ux"] }, { title: "Churn Prediction Model", confidence: 85, desc: "Build logistic regression model to score churn risk and identify at-risk accounts proactively", tags: ["churn", "ml", "prediction"] }],
            [{ title: "Regional Efficiency Benchmarking", confidence: 88, desc: "Compare KPIs across distribution centres controlling for volume mix and facility age", tags: ["operations", "benchmarking", "logistics"] }, { title: "Inventory Optimisation Simulation", confidence: 76, desc: "Run Monte Carlo simulation to determine optimal safety stock levels per region", tags: ["inventory", "simulation", "optimisation"] }],
          ][i],
          follow_up_questions: [
            ["What is the margin impact of removing bottom 10% SKUs?", "Are there contractual pricing commitments preventing adjustments?", "What competitors operate in the same price band as Premium product line?"],
            ["What is the customer acquisition cost by channel to assess retention ROI?", "Are there any product usage patterns that precede churn?", "Have win-back campaigns been attempted? With what success rate?"],
            ["What is the capex plan for West region facility upgrades?", "Are labour costs accounted for in the efficiency metric?", "What is the demand forecast for next 12 months across regions?"],
          ][i],
          assumptions: [
            ["12-month data window is sufficient to identify trends", "Returns data is representative despite 8% missing values", "Current product categorisation is stable — no major reorg planned"],
            ["Churn definitions are consistent across the 12-month period", "Customer segment classifications have not changed", "Support ticket volume is a proxy for customer satisfaction"],
            ["Efficiency metrics are comparable across regions with different facility ages", "Inventory data frequency is adequate for turnover analysis", "Cost allocations reflect true resource consumption"],
          ][i],
          confidence_score: [85, 72, 90][i],
          data_completeness: [78, 82, 65][i],
        });
      }
    }
  }

  const { error: se } = await supabase.from("sessions").insert(sessions);
  if (se) throw se;
  console.log("Sessions:", sessions.length);

  const { error: ie } = await supabase.from("session_inputs").insert(inputs);
  if (ie) throw ie;
  console.log("Inputs:", inputs.length);

  if (outputs.length) {
    const { error: oe } = await supabase.from("session_outputs").insert(outputs);
    if (oe) throw oe;
    console.log("Outputs:", outputs.length);
  }

  // Consultant notes
  const notes = [
    { session_id: sessions[0].id, note_text: "Client requested deeper look into East region margin decline. Follow up in next review." },
    { session_id: sessions[1].id, note_text: "Preliminary findings shared with client. They want to prioritise billing friction analysis." },
    { session_id: sessions[3].id, note_text: "Awaiting additional data from client — inventory records for Q4 2024 not yet provided." },
  ];
  const { error: ne } = await supabase.from("consultant_notes").insert(notes);
  if (ne) throw ne;
  console.log("Notes:", notes.length);

  console.log("Seed complete!");
}

seed().catch(console.error);
