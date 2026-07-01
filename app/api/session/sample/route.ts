import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase/client";
import { createSession } from "@/lib/supabase/queries";
import * as fs from "node:fs";
import * as path from "node:path";

export async function POST() {
  try {
    const sb = getSupabase();

    // Ensure demo client exists
    const { data: existing } = await sb
      .from("clients")
      .select("id")
      .eq("name", "Demo Retail Client")
      .single();

    let clientId: string;
    if (existing) {
      clientId = existing.id;
    } else {
      const { data: client, error: clientErr } = await sb
        .from("clients")
        .insert({ name: "Demo Retail Client", sector: "E-Commerce" })
        .select()
        .single();
      if (clientErr) throw clientErr;
      clientId = client.id;
    }

    // Create session
    const session = await createSession({
      clientId,
      title: "E-Commerce Performance Review",
      consultant: "",
      analysisType: ["Descriptive", "Diagnostic"],
    });

    // Read sample CSV
    const filePath = path.join(process.cwd(), "public", "sample-data.csv");
    const csvBuffer = fs.readFileSync(filePath);

    // Upload to Supabase Storage
    const storagePath = `uploads/${session.id}/sample-data.csv`;
    const { error: uploadErr } = await sb.storage
      .from("client-uploads")
      .upload(storagePath, csvBuffer, {
        contentType: "text/csv",
        upsert: true,
      });

    if (uploadErr) throw uploadErr;

    return NextResponse.json({ sessionId: session.id, storagePath });
  } catch (error: any) {
    console.error("Failed to create sample session", error);
    return NextResponse.json(
      { error: error.message ?? "Failed to create sample session" },
      { status: 500 }
    );
  }
}
