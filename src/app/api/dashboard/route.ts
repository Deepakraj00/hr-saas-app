import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      statusCounts,
      upcomingInterviews,
      recentCandidates,
      todaysInterviews,
      todaysJoinees,
    ] = await Promise.all([
      prisma.candidate.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      prisma.interview.count({
        where: {
          scheduledAt: { gte: new Date() },
          status: "SCHEDULED",
        },
      }),
      prisma.candidate.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, name: true, email: true, status: true, createdAt: true }
      }),
      prisma.candidate.findMany({
        where: {
          interviewDate: { gte: today, lt: tomorrow },
        },
        select: { id: true, name: true, interviewTime: true, status: true, email: true },
        orderBy: { interviewTime: "asc" }
      }),
      prisma.candidate.findMany({
        where: {
          joiningDate: { gte: today, lt: tomorrow },
        },
        select: { id: true, name: true, status: true, email: true },
      }),
    ]);

    const counts = statusCounts.reduce((acc: any, curr) => {
      acc[curr.status] = curr._count.status;
      return acc;
    }, {});

    const totalCandidates = statusCounts.reduce((acc, curr) => acc + curr._count.status, 0);
    const newCount = counts["NEW"] || 0;
    const inReviewCount = counts["IN_REVIEW"] || 0;
    const interviewCount = counts["INTERVIEW"] || 0;
    const hiredCount = counts["HIRED"] || 0;
    const rejectedCount = counts["REJECTED"] || 0;

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
      todaysInterviews,
      todaysJoinees,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
