import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import * as XLSX from "xlsx";

// GET /api/candidates/export — Download candidates as Excel
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    if (status && status !== "ALL") {
      where.status = status;
    }

    const candidates = await prisma.candidate.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { interviews: true },
    });

    // Build Excel data
    const rows = candidates.map((c) => ({
      "Name": c.name,
      "Email": c.email,
      "Phone": c.phone || "",
      "Status": c.status,
      "Interview Date": c.interviewDate ? new Date(c.interviewDate).toLocaleDateString() : "",
      "Interview Time": c.interviewTime || "",
      "Joining Date": c.joiningDate ? new Date(c.joiningDate).toLocaleDateString() : "",
      "Source": c.source,
      "Interviews": c.interviews.length,
      "Next Interview": c.interviews
        .filter((i) => i.status === "SCHEDULED" && new Date(i.scheduledAt) > new Date())
        .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
        .map((i) =>
          `${i.type} - ${new Date(i.scheduledAt).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}`
        )
        .join(", ") || "",
      "Added On": new Date(c.createdAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    }));

    // Create workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);

    // Auto-size columns
    const colWidths = Object.keys(rows[0] || {}).map((key) => ({
      wch: Math.max(
        key.length,
        ...rows.map((r) => String(r[key as keyof typeof r]).length)
      ) + 2,
    }));
    ws["!cols"] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, "Candidates");

    // Generate buffer
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    const today = new Date().toISOString().split("T")[0];
    const filename = `HireFlow_Candidates_${today}.xlsx`;

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("Export error:", err);
    return NextResponse.json({ error: "Failed to export candidates" }, { status: 500 });
  }
}
