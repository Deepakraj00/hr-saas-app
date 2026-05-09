import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const [
      totalCandidates,
      newCount,
      inReviewCount,
      interviewCount,
      hiredCount,
      rejectedCount,
      upcomingInterviews,
      recentCandidates,
    ] = await Promise.all([
      prisma.candidate.count(),
      prisma.candidate.count({ where: { status: "NEW" } }),
      prisma.candidate.count({ where: { status: "IN_REVIEW" } }),
      prisma.candidate.count({ where: { status: "INTERVIEW" } }),
      prisma.candidate.count({ where: { status: "HIRED" } }),
      prisma.candidate.count({ where: { status: "REJECTED" } }),
      prisma.interview.count({
        where: {
          scheduledAt: { gte: new Date() },
          status: "SCHEDULED",
        },
      }),
      prisma.candidate.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    return NextResponse.json({
      stats: {
        totalCandidates,
        newCount,
        inReviewCount,
        interviewCount,
        hiredCount,
        rejectedCount,
        upcomingInterviews,
      },
      pipeline: [
        { name: "New", value: newCount, color: "#6366f1" },
        { name: "In Review", value: inReviewCount, color: "#f59e0b" },
        { name: "Interview", value: interviewCount, color: "#3b82f6" },
        { name: "Hired", value: hiredCount, color: "#10b981" },
        { name: "Rejected", value: rejectedCount, color: "#ef4444" },
      ],
      recentCandidates,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
