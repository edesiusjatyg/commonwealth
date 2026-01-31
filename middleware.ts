import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getCurrentUserId } from "@/lib/session";

// Routes that require authentication
const protectedRoutes = [
	"/actions",
	"/init-wallet",
	"/notifications",
	"/chat",
	"/onboarding",
	"/trading",
	"/home",
	"/portfolio",
	"/profile",
	"/financial",
];

// Routes that should NOT be accessible when authenticated
const authRoutes = ["/login", "/register", "/login-with-base"];

export async function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// Skip middleware for static assets and API routes
	if (
		pathname.startsWith("/_next") ||
		pathname.startsWith("/api") ||
		pathname.includes(".")
	) {
		return NextResponse.next();
	}

	// Get current user session
	const userId = await getCurrentUserId();
	const isAuthenticated = !!userId;

	// Check if user is trying to access auth routes while authenticated
	const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
	if (isAuthRoute && isAuthenticated) {
		// Redirect to home with a warning toast parameter
		const url = request.nextUrl.clone();
		url.pathname = "/home";
		url.searchParams.set("toast", "already-authenticated");
		return NextResponse.redirect(url);
	}

	// Check if user is trying to access protected routes without authentication
	const isProtectedRoute = protectedRoutes.some((route) =>
		pathname.startsWith(route),
	);
	if (isProtectedRoute && !isAuthenticated) {
		// Redirect to login with the original path as redirect parameter
		const url = request.nextUrl.clone();
		url.pathname = "/login";
		url.searchParams.set("redirect", pathname);
		return NextResponse.redirect(url);
	}

	return NextResponse.next();
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 * - public folder
		 */
		"/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
	],
};
