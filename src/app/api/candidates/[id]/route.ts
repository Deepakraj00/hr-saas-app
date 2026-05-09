import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { pusherServer, CHANNELS, EVENTS } from "@/lib/pusher-server";

// GET /api/candidates/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const candidate = await prisma.candidate.findUnique({
      where: { id },
      include: { interviews: true },
    });
    if (!candidate) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(candidate);
  } catch {
    return NextResponse.json({ error: "Failed to fetch candidate" }, { status: 500 });
  }
}

// PATCH /api/candidates/[id] - Update candidate
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json();
    const candidate = await prisma.candidate.update({
      where: { id },
      data: body,
    });

    await pusherServer.trigger(CHANNELS.CANDIDATES, EVENTS.CANDIDATE_UPDATED, candidate);

    return NextResponse.json(candidate);
  } catch {
    return NextResponse.json({ error: "Failed to update candidate" }, { status: 500 });
  }
}

// DELETE /api/candidates/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await prisma.candidate.delete({ where: { id } });

    await pusherServer.trigger(CHANNELS.CANDIDATES, EVENTS.CANDIDATE_DELETED, { id });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete candidate" }, { status: 500 });
  }
}
