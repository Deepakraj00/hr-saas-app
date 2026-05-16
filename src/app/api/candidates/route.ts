import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { pusherServer, CHANNELS, EVENTS } from "@/lib/pusher-server";

// GET /api/candidates - List all candidates with search, filter, pagination
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { role: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status && status !== "ALL") {
      where.status = status;
    }

    const [candidates, total] = await Promise.all([
      prisma.candidate.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: { interviews: true },
      }),
      prisma.candidate.count({ where }),
    ]);

    return NextResponse.json({
      candidates,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch candidates" }, { status: 500 });
  }
}

// POST /api/candidates - Create a new candidate
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, role, status, interviewDate, interviewTime, joiningDate } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    const candidate = await prisma.candidate.create({
      data: { 
        name, 
        email, 
        phone, 
        role,
        status, 
        interviewDate: interviewDate ? new Date(interviewDate) : null,
        interviewTime: interviewTime || null,
        joiningDate: joiningDate ? new Date(joiningDate) : null
      },
    });

    // Trigger real-time event for collaboration
    pusherServer.trigger(CHANNELS.CANDIDATES, EVENTS.CANDIDATE_ADDED, candidate).catch((err) => console.error('Pusher error:', err));

    return NextResponse.json(candidate, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create candidate" }, { status: 500 });
  }
}
