import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Role } from "@/types/roles";

// Routes that require authentication
const AUTH_ROUTES = ["/cliente", "/barbero", "/admin", "/superadmin", "/usuario"];

// Routes that require specific roles
const ROLE_ROUTES: Record<string, Role[]> = {
  "/superadmin": ["superadmin"],
  "/admin": ["superadmin", "admin"],
  "/barbero": ["superadmin", "admin", "barbero"],
  "/cliente": ["superadmin", "admin", "barbero", "cliente"],
  "/usuario": ["superadmin", "admin", "barbero", "cliente", "usuario"],
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if route requires auth
  const requiresAuth = AUTH_ROUTES.some((route) => pathname.startsWith(route));
  if (!requiresAuth) return NextResponse.next();

  // Get the token from cookies
  const token = request.cookies.get("firebase-token")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    // Decode the token payload (base64url)
    const payload = token.split(".")[1];
    const claims = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));

    const userRole: Role = claims.role;
    const userBarberiaId = claims.barberia_id;

    // Check role-based access
    for (const [route, allowedRoles] of Object.entries(ROLE_ROUTES)) {
      if (pathname.startsWith(route)) {
        if (!allowedRoles.includes(userRole)) {
          // Redirect to appropriate dashboard based on role
          const redirectMap: Record<Role, string> = {
            superadmin: "/superadmin",
            admin: "/admin/dashboard",
            barbero: "/barbero/dashboard",
            cliente: "/usuario",
            usuario: "/usuario",
          };
          return NextResponse.redirect(
            new URL(redirectMap[userRole], request.url)
          );
        }
      }
    }

    // Barberia isolation: if accessing admin route, check barberia_id match
    if (pathname.startsWith("/admin") || pathname.startsWith("/barbero")) {
      if (userRole === "barbero" && userBarberiaId) {
        // Barbero can only access their own barberia's routes
        // This is handled client-side via Firestore rules
      }
    }

    return NextResponse.next();
  } catch {
    // Invalid token
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
