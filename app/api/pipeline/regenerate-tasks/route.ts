import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase/client";
import { generateTasksLLM } from "@/lib/pipeline/generate-tasks-llm";

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json();
    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    const sb = getSupabase();

    // Load session to get briefText and businessGoal
    const { data: session } = await sb
      .from("sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    // Load session inputs for briefText and businessGoal
    const { data: inputRow } = await sb
      .from("session_inputs")
      .select("*")
      .eq("session_id", sessionId)
      .single();

    // Load session outputs for pipeline output
    const { data: outputRow } = await sb
      .from("session_outputs")
      .select("*")
      .eq("session_id", sessionId)
      .single();

    if (!outputRow) {
      return NextResponse.json({ error: "Session output not found" }, { status: 404 });
    }

    const output = {
      execSummary: outputRow.exec_summary ?? "",
      keySignals: outputRow.key_signals ?? [],
      dataQualityFlags: outputRow.data_quality_flags ?? [],
      recommendedAnalyses: outputRow.recommended_analyses ?? [],
      followUpQuestions: outputRow.follow_up_questions ?? [],
      assumptions: outputRow.assumptions ?? [],
      confidenceScore: outputRow.confidence_score ?? 0,
      dataCompleteness: outputRow.data_completeness ?? 0,
    };

    const stats = outputRow.stat_summary ?? {
      correlations: [],
      distributions: [],
      topValues: [],
      outliers: [],
    };

    const briefText = inputRow?.brief_text ?? "";
    const businessGoal = inputRow?.business_goal ?? "";

    const tasks = await generateTasksLLM(output, stats, briefText, businessGoal);

    // Update tasks in DB
    await sb.from("session_outputs").update({ tasks }).eq("id", outputRow.id);

    return NextResponse.json({ tasks });
  } catch (error: any) {
    console.error("Regenerate tasks error:", error);
    return NextResponse.json(
      { error: error.message ?? "Failed to regenerate tasks" },
      { status: 500 }
    );
  }
}
