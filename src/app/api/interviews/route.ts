import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { pusherServer, CHANNELS, EVENTS } from "@/lib/pusher-server";

// GET /api/interviews
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "";

    const where: Record<string, unknown> = {};
    if (status && status !== "ALL") {
      where.status = status;
    }

    const interviews = await prisma.interview.findMany({
      where,
      include: { candidate: true },
      orderBy: { scheduledAt: "asc" },
    });

    return NextResponse.json({ interviews });
  } catch {
    return NextResponse.json({ error: "Failed to fetch interviews" }, { status: 500 });
  }
}

// POST /api/interviews
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { candidateId, scheduledAt, type, notes } = body;

    if (!candidateId || !scheduledAt || !type) {
      return NextResponse.json(
        { error: "candidateId, scheduledAt, and type are required" },
        { status: 400 }
      );
    }

    const interview = await prisma.interview.create({
      data: {
        candidateId,
        scheduledAt: new Date(scheduledAt),
        type,
        notes,
      },
      include: { candidate: true },
    });

    // Update candidate status to INTERVIEW
    await prisma.candidate.update({
      where: { id: candidateId },
      data: { status: "INTERVIEW" },
    });

    pusherServer.trigger(CHANNELS.INTERVIEWS, EVENTS.INTERVIEW_ADDED, interview).catch((err) => console.error('Pusher error:', err));

    return NextResponse.json(interview, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create interview" }, { status: 500 });
  }
}
