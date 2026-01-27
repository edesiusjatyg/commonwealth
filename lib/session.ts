import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SESSION_SECRET = process.env.SESSION_SECRET || "development-secret-change-in-production";
const COOKIE_NAME = "session";

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

	cookieStore.set(COOKIE_NAME, token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "strict",
		maxAge: 60 * 60 * 24 * 7, // 1 week
		path: "/",
	});
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
	const token = cookieStore.get(COOKIE_NAME)?.value;

	if (!token) {
		return null;
	}

	return await decryptSession(token);
}
