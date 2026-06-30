import { NextRequest, NextResponse } from "next/server";
import { runPipeline } from "@/lib/pipeline";
import { saveSessionInput, saveSessionOutput, finalizeSession } from "@/lib/supabase/queries";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, csvContent, fileName, storagePath, briefText, businessGoal } = body;

    if (!sessionId || !csvContent || !fileName) {
      return NextResponse.json(
        { error: "Missing required fields: sessionId, csvContent, fileName" },
        { status: 400 }
      );
    }

    // Run the pipeline
    const { profile, output } = runPipeline({
      csvContent,
      fileName,
      storagePath: storagePath ?? `uploads/${sessionId}/${fileName}`,
      briefText,
    });

    // Save session input
    await saveSessionInput(sessionId, {
      briefText: briefText ?? "",
      businessGoal: businessGoal ?? "",
      constraints: "",
      dataFiles: [
        {
          fileName: profile.fileName,
          fileType: "csv",
          fileUrl: storagePath ?? `uploads/${sessionId}/${fileName}`,
          rowCount: profile.rowCount,
          columnCount: profile.columnCount,
          sizeKb: profile.sizeKb,
          columns: profile.columns.map((c) => c.name),
          dtypes: Object.fromEntries(profile.columns.map((c) => [c.name, c.dtype])),
          nullPct: Object.fromEntries(profile.columns.map((c) => [c.name, c.nullPct])),
          sample: profile.sampleRows.slice(0, 5),
        },
      ],
    });

    // Save session output
    await saveSessionOutput(sessionId, {
      execSummary: output.execSummary,
      keySignals: output.keySignals,
      dataQualityFlags: output.dataQualityFlags,
      recommendedAnalyses: output.recommendedAnalyses,
      followUpQuestions: output.followUpQuestions,
      assumptions: output.assumptions,
      confidenceScore: output.confidenceScore,
      dataCompleteness: output.dataCompleteness,
    });

    // Mark session as complete
    await finalizeSession(sessionId);

    return NextResponse.json({ sessionId, output, profile });
  } catch (error: any) {
    console.error("Pipeline error:", error);
    return NextResponse.json(
      { error: error.message ?? "Pipeline execution failed" },
      { status: 500 }
    );
  }
}
