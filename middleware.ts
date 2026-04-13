import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { loginPortalRoutes } from "@/lib/auth/portal";
import { dashboardRoutes } from "@/lib/navigation";
import { verifySession } from "@/lib/auth/session";

const SESSION_COOKIE = "condoreserva.session";

const roleRoutes = {
  "/admin": "ADMINISTRADOR",
  "/sindico": "SINDICO",
  "/morador": "MORADOR",
} as const;

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const pathname = request.nextUrl.pathname;
  const isProfileRoute = pathname.startsWith("/perfil");

  const protectedPrefix = Object.keys(roleRoutes).find((prefix) => pathname.startsWith(prefix));
  if (!protectedPrefix && !isProfileRoute) {
    return NextResponse.next();
  }

  if (!token) {
    if (isProfileRoute) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.redirect(
      new URL(loginPortalRoutes[roleRoutes[protectedPrefix as keyof typeof roleRoutes]], request.url),
    );
  }

  try {
    const session = await verifySession(token);
    if (isProfileRoute) {
      return NextResponse.next();
    }

    const requiredRole = roleRoutes[protectedPrefix as keyof typeof roleRoutes];

    if (session.role !== requiredRole) {
      return NextResponse.redirect(new URL(dashboardRoutes[session.role], request.url));
    }

    return NextResponse.next();
  } catch {
    if (isProfileRoute) {
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete(SESSION_COOKIE);
      return response;
    }

    const response = NextResponse.redirect(
      new URL(loginPortalRoutes[roleRoutes[protectedPrefix as keyof typeof roleRoutes]], request.url),
    );
    response.cookies.delete(SESSION_COOKIE);
    return response;
  }
}

export const config = {
  matcher: ["/admin/:path*", "/sindico/:path*", "/morador/:path*", "/perfil/:path*"],
};
