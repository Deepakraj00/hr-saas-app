import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// DELETE /api/users/[id] — Delete a user (admin only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = req.cookies.get("session");
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const currentUser = JSON.parse(session.value);
    if (currentUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden — Admin only" }, { status: 403 });
    }

    // Prevent deleting yourself
    if (currentUser.id === id) {
      return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });
    }

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
