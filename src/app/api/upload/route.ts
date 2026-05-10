import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { parseExcelBuffer } from "@/lib/excel-parser";
import { pusherServer, CHANNELS, EVENTS } from "@/lib/pusher-server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const roleInput = formData.get("role") as string || null;

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
    const dataToInsert = parsed.map(c => ({
      name: c.name,
      email: c.email || `${c.name.toLowerCase().replace(/\s+/g, ".")}@imported.local`,
      phone: c.phone || null,
      source: c.source,
      status: c.status || "NEW",
      role: c.role || roleInput,
      interviewDate: c.interviewDate ? new Date(c.interviewDate) : null,
      interviewTime: c.interviewTime || null,
      joiningDate: c.joiningDate ? new Date(c.joiningDate) : null,
    }));

    // Generate unique emails if there are duplicates inside the file itself to avoid createMany failing
    const uniqueData = Array.from(new Map(dataToInsert.map(item => [item.email, item])).values());

    const result = await prisma.candidate.createMany({
      data: uniqueData,
      skipDuplicates: true,
    });
    
    const created = result.count;
    const skipped = parsed.length - created;

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
