import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import * as crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

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
    if (currentUser.role !== "ADMIN" && currentUser.role !== "HR") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

// PATCH /api/users/[id] — Update a user's credentials (admin/hr only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = req.cookies.get("session");
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const currentUser = JSON.parse(session.value);
    if (currentUser.role !== "ADMIN" && currentUser.role !== "HR") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { email, password } = await req.json();

    const updateData: any = {};
    if (email) updateData.email = email;
    if (password) updateData.password = hashPassword(password);

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, user: { id: updatedUser.id, email: updatedUser.email } });
  } catch {
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
