import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public routes that don't need auth
  const publicRoutes = ["/", "/login", "/api/auth/login", "/api/auth/logout"];
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Check session cookie for protected routes
  const session = req.cookies.get("session");

  if (!session) {
    // API routes return 401
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Page routes redirect to login
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Validate session is parseable
  try {
    JSON.parse(session.value);
  } catch {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }
    const response = NextResponse.redirect(new URL("/login", req.url));
    response.cookies.delete("session");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
};
