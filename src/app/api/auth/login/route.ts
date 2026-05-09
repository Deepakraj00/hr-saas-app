import { NextRequest, NextResponse } from "next/server";
import * as crypto from "crypto";
import prisma from "@/lib/db";

// Simple password hash (matches seed)
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || user.password !== hashPassword(password)) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Create a simple session token
    const token = crypto.randomBytes(32).toString("hex");
    const sessionData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
    };

    const response = NextResponse.json({ user: sessionData });

    // Set session cookie
    response.cookies.set("session", JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
