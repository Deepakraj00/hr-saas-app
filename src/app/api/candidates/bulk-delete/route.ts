import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { pusherServer, CHANNELS, EVENTS } from "@/lib/pusher-server";

// POST /api/candidates/bulk-delete
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "Invalid or empty IDs provided" }, { status: 400 });
    }

    const deleteResult = await prisma.candidate.deleteMany({
      where: {
        id: { in: ids },
      },
    });

    // Notify clients that a bulk deletion happened so they can refresh
    pusherServer.trigger(CHANNELS.CANDIDATES, EVENTS.CANDIDATE_DELETED, { bulk: true, ids }).catch((err) => console.error('Pusher error:', err));

    return NextResponse.json({ success: true, count: deleteResult.count });
  } catch (error) {
    console.error("Bulk delete error:", error);
    return NextResponse.json({ error: "Failed to delete candidates" }, { status: 500 });
  }
}
