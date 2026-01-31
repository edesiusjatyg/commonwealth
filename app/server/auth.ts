"use server";

import { prisma } from "@/lib/prisma";
import { setSessionCookie, clearSessionCookie, getCurrentUserId } from "@/lib/session";
import { AuthResponse } from "@/types";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { generateAccount } from "./chain";
import { encrypt } from "@/lib/crypto";


// Input schemas
const loginSchema = z
	.object({
		email: z.string().email().optional(),
		password: z.string().optional(),
		baseSocialId: z.string().optional(),
	})
	.refine((data) => (data.email && data.password) || data.baseSocialId, {
		message: "Either email/password or Base Social ID must be provided",
	});

const registerSchema = z.object({
	email: z.string().email("Invalid email format"),
	password: z.string().min(8, "Password must be at least 8 characters"),
	baseSocialId: z.string().optional(),
});

// Input types
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * Login with email/password or Base Social ID
 */
export async function login(input: LoginInput): Promise<AuthResponse> {
	try {
		const validatedData = loginSchema.safeParse(input);

		if (!validatedData.success) {
			return {
				error: validatedData.error.issues[0].message,
				message: "Validation failed",
			};
		}

		const { email, password, baseSocialId } = validatedData.data;

		let user = null;
		if (baseSocialId) {
			user = await prisma.user.findUnique({
				where: { baseSocialId },
			});
		} else if (email && password) {
			user = await prisma.user.findUnique({
				where: { email },
			});

			if (user && user.passwordHash) {
				const passwordMatch = await bcrypt.compare(password, user.passwordHash);
				if (!passwordMatch) {
					user = null;
				}
			} else {
				user = null;
			}
		}

		if (!user) {
			return {
				error: "Invalid credentials",
				message: "Login failed",
			};
		}

		// Set encrypted session cookie
		await setSessionCookie(user.id);

		return {
			message: "Login successful",
			userId: user.id,
			onboarded: user.onboarded,
		};
	} catch (error: any) {
		console.error("Login error:", error);
		return {
			error: "Internal server error",
			message: "System error",
		};
	}
}

/**
 * Logout current user
 */
export async function logout(): Promise<AuthResponse> {
	await clearSessionCookie();
	return { message: "Logout successful" };
}

/**
 * Register a new user with email/password
 */
export async function register(input: RegisterInput): Promise<AuthResponse> {
	try {
		const validatedData = registerSchema.safeParse(input);

		if (!validatedData.success) {
			return {
				error: validatedData.error.issues[0].message,
				message: "Validation failed",
			};
		}

		const { email, password, baseSocialId } = validatedData.data;

		const existingUser = await prisma.user.findUnique({
			where: { email },
		});

		if (existingUser) {
			return {
				error: "Email already registered",
				message: "Registration failed",
			};
		}

		if (baseSocialId) {
			const existingSocialUser = await prisma.user.findUnique({
				where: { baseSocialId },
			});

			if (existingSocialUser) {
				return {
					error: "Social account already registered",
					message: "Registration failed",
				};
			}
		}

		const passwordHash = await bcrypt.hash(password, 10);

		const { privateKey, address: eoaAddress } = generateAccount();
		const encryptedKey = encrypt(privateKey);

		const user = await prisma.user.create({
			data: {
				email,
				passwordHash,
				baseSocialId,
				eoaAddress,
				encryptedKey: encryptedKey,
			},
		});

		// Set encrypted session cookie
		await setSessionCookie(user.id);

		return {
			message: "User registered successfully",
			userId: user.id,
		};
	} catch (error: any) {
		console.error("Registration error:", error);
		return {
			error: "Internal server error",
			message: "System error",
		};
	}
}
/**
 * Get the current user info
 */
export async function getCurrentUser(): Promise<{ id: string; email: string | null; onboarded: boolean } | null> {
	try {
		const userId = await getCurrentUserId();
		if (!userId) {
			console.warn("[getCurrentUser] Current userId is missing:", userId);
			return null;
		}

		console.log("[getCurrentUser] Found userId:", userId);

		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: {
				id: true,
				email: true,
				onboarded: true,
			},
		});

		if (user) {
			console.log("[getCurrentUser] User found:", {
				id: user.id,
				email: user.email,
				onboarded: user.onboarded,
			});
		} else {
			console.warn(
				"[getCurrentUser] No user found in database for userId:",
				userId,
			);
		}

		return user;
	} catch (error) {
		console.error("[getCurrentUser] Error:", error);
		return null;
	}
}
