import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { parseExcelBuffer } from "@/lib/excel-parser";
import { pusherServer, CHANNELS, EVENTS } from "@/lib/pusher-server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const parsed = parseExcelBuffer(buffer);

    if (parsed.length === 0) {
      return NextResponse.json(
        { error: "No valid candidates found in the file. Please check the column headers." },
        { status: 400 }
      );
    }

    // Bulk insert candidates
    let created = 0;
    let skipped = 0;
    for (const c of parsed) {
      try {
        await prisma.candidate.create({
          data: {
            name: c.name,
            email: c.email || `${c.name.toLowerCase().replace(/\s+/g, ".")}@imported.local`,
            phone: c.phone,
            source: c.source,
            status: c.status || "NEW",
          },
        });
        created++;
      } catch {
        skipped++;
      }
    }

    // Trigger real-time refresh
    await pusherServer.trigger(CHANNELS.CANDIDATES, EVENTS.CANDIDATE_ADDED, {
      bulk: true,
      count: created,
    });

    return NextResponse.json({
      message: `Successfully imported ${created} candidates. ${skipped} skipped (duplicates or errors).`,
      created,
      skipped,
      total: parsed.length,
    });
  } catch {
    return NextResponse.json({ error: "Failed to process upload" }, { status: 500 });
  }
}
