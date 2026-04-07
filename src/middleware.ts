/**
 * Next.js Middleware
 *
 * Protects all /dashboard, /projects, /contracts, /messages, /settings, /admin routes.
 * Redirects unauthenticated users to /login.
 * Redirects authenticated users away from /login and /register.
 * Admin routes require admin role.
 */

import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// Routes that require authentication
const PROTECTED_PATHS = [
  "/dashboard",
  "/projects",
  "/contracts",
  "/messages",
  "/settings",
  "/freelancers",
  "/admin",
];

// Routes that authenticated users should be redirected away from
const AUTH_PATHS = ["/login", "/register", "/forgot-password"];

// Routes that require admin role
const ADMIN_PATHS = ["/admin"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAuthenticated = !!req.auth?.user;
  const userRole = req.auth?.user?.role;

  // Check if the path matches any protected routes
  const isProtectedPath = PROTECTED_PATHS.some((p) =>
    pathname.startsWith(p)
  );
  const isAuthPath = AUTH_PATHS.some((p) => pathname.startsWith(p));
  const isAdminPath = ADMIN_PATHS.some((p) => pathname.startsWith(p));

  // Redirect unauthenticated users to login
  if (isProtectedPath && !isAuthenticated) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from auth pages
  if (isAuthPath && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Require admin role for admin paths
  if (isAdminPath && isAuthenticated && userRole !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Match all routes except static files, api routes, and _next
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
};
