import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SESSION_SECRET = process.env.SESSION_SECRET || "development-secret-change-in-production";
const COOKIE_NAME = "session";
const IS_LOCAL_HTTP = process.env.IS_LOCAL_HTTP === "true";
const IS_PROD = process.env.NODE_ENV === "production";

console.log("[session.ts] IS_LOCAL_HTTP:", IS_LOCAL_HTTP);
console.log("[session.ts] IS_PROD:", IS_PROD);

// Derive a key from the secret
const getSecretKey = () => new TextEncoder().encode(SESSION_SECRET);

/**
 * Encrypt a userId into a JWT token
 */
export async function encryptSession(userId: string): Promise<string> {
	const token = await new SignJWT({ userId })
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.setExpirationTime("7d")
		.sign(getSecretKey());

	return token;
}

/**
 * Decrypt a JWT token and return the userId
 */
export async function decryptSession(token: string): Promise<string | null> {
	try {
		const { payload } = await jwtVerify(token, getSecretKey());
		return payload.userId as string;
	} catch {
		return null;
	}
}

/**
 * Set encrypted session cookie (to be called from server actions)
 */
export async function setSessionCookie(userId: string): Promise<void> {
	const token = await encryptSession(userId);
	const cookieStore = await cookies();

	const cookieOptions = {
		httpOnly: true,
		secure: IS_PROD && !IS_LOCAL_HTTP, // Secure in production over HTTPS, IS_LOCAL_HTTP allows for local testing
		sameSite: "lax" as const, // "lax" allows cookies on navigation
		maxAge: 60 * 60 * 24 * 7, // 1 week
		path: "/",
	};

	console.log("[setSessionCookie] Setting cookie with options:", cookieOptions);
	cookieStore.set(COOKIE_NAME, token, cookieOptions);

	console.log("[setSessionCookie] Cookie set for userId:", userId);

	// Verify the cookie was set by reading it back immediately
	const verification = cookieStore.get(COOKIE_NAME);
	if (verification) {
		console.log(
			"[setSessionCookie] ✓ Cookie verified in store, value length:",
			verification.value.length,
		);
	} else {
		console.error(
			"[setSessionCookie] ✗ WARNING: Cookie not found after setting!",
		);
	}
}

/**
 * Clear the session cookie
 */
export async function clearSessionCookie(): Promise<void> {
	const cookieStore = await cookies();
	cookieStore.delete(COOKIE_NAME);
}

/**
 * Get the current user ID from the encrypted session cookie
 * Returns null if no valid session exists
 */
export async function getCurrentUserId(): Promise<string | null> {
	const cookieStore = await cookies();

	// Debug: List all cookies
	const allCookies = cookieStore.getAll();
	console.log(
		"[getCurrentUserId] All cookies:",
		allCookies.map((c) => c.name),
	);

	const token = cookieStore.get(COOKIE_NAME)?.value;

	if (!token) {
		console.warn(
			"[getCurrentUserId] No session cookie found. Looking for:",
			COOKIE_NAME,
		);
		return null;
	}

	console.log("[getCurrentUserId] Session cookie found, decrypting...");
	const userId = await decryptSession(token);

	if (userId) {
		console.log("[getCurrentUserId] Session valid for userId:", userId);
	} else {
		console.warn(
			"[getCurrentUserId] Session cookie found but failed to decrypt",
		);
	}

	return userId;
}
