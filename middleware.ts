import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Protected routes that require authentication
const PROTECTED_ROUTES = [
	"/actions/**",
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

/**
 * Middleware to protect routes and redirect unauthenticated users to login
 */
export function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// Check if the route is protected
	const isProtectedRoute = PROTECTED_ROUTES.some((route) => {
		if (route.endsWith("/**")) {
			const baseRoute = route.replace("/**", "");
			return pathname.startsWith(baseRoute);
		}
		return pathname === route || pathname.startsWith(`${route}/`);
	});

	// If not a protected route, allow access
	if (!isProtectedRoute) {
		return NextResponse.next();
	}

	// Check for authentication - looking for session cookie
	const sessionCookie = request.cookies.get("session");

	// If no session cookie, redirect to login
	if (!sessionCookie) {
		const loginUrl = new URL("/login", request.url);
		// Add redirect parameter to return user after login
		loginUrl.searchParams.set("redirect", pathname);
		return NextResponse.redirect(loginUrl);
	}

	// User is authenticated, allow access
	return NextResponse.next();
}

/**
 * Configure which routes this middleware should run on
 */
export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - api (API routes)
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 * - public folder
		 */
		"/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
	],
};
