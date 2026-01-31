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
	console.info("[auth.login] Login attempt started", { 
		hasEmail: !!input.email, 
		hasBaseSocialId: !!input.baseSocialId 
	});
	
	try {
		const validatedData = loginSchema.safeParse(input);

		if (!validatedData.success) {
			console.warn("[auth.login] Validation failed", { 
				error: validatedData.error.issues[0].message 
			});
			return {
				error: validatedData.error.issues[0].message,
				message: "Validation failed",
			};
		}

		const { email, password, baseSocialId } = validatedData.data;

		let user = null;
		if (baseSocialId) {
			console.info("[auth.login] Attempting Base Social ID login", { baseSocialId });
			user = await prisma.user.findUnique({
				where: { baseSocialId },
			});
		} else if (email && password) {
			console.info("[auth.login] Attempting email/password login", { email });
			user = await prisma.user.findUnique({
				where: { email },
			});

			if (user && user.passwordHash) {
				const passwordMatch = await bcrypt.compare(password, user.passwordHash);
				if (!passwordMatch) {
					console.warn("[auth.login] Password mismatch", { email });
					user = null;
				}
			} else {
				console.warn("[auth.login] User not found or no password hash", { email });
				user = null;
			}
		}

		if (!user) {
			console.warn("[auth.login] Login failed - invalid credentials");
			return {
				error: "Invalid credentials",
				message: "Login failed",
			};
		}

		// Set encrypted session cookie
		await setSessionCookie(user.id);
		console.info("[auth.login] Login successful", { userId: user.id });

		return {
			message: "Login successful",
			userId: user.id,
			onboarded: user.onboarded,
		};
	} catch (error: unknown) {
		console.error("[auth.login] Login error:", error);
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
	console.info("[auth.logout] Logout initiated");
	await clearSessionCookie();
	console.info("[auth.logout] Logout successful");
	return { message: "Logout successful" };
}

/**
 * Register a new user with email/password
 */
export async function register(input: RegisterInput): Promise<AuthResponse> {
	console.info("[auth.register] Registration attempt started", { 
		hasEmail: !!input.email,
		hasBaseSocialId: !!input.baseSocialId 
	});
	
	try {
		const validatedData = registerSchema.safeParse(input);

		if (!validatedData.success) {
			console.warn("[auth.register] Validation failed", { 
				error: validatedData.error.issues[0].message 
			});
			return {
				error: validatedData.error.issues[0].message,
				message: "Validation failed",
			};
		}

		const { email, password, baseSocialId } = validatedData.data;

		console.info("[auth.register] Checking for existing user", { email });
		const existingUser = await prisma.user.findUnique({
			where: { email },
		});

		if (existingUser) {
			console.warn("[auth.register] Email already registered", { email });
			return {
				error: "Email already registered",
				message: "Registration failed",
			};
		}

		if (baseSocialId) {
			console.info("[auth.register] Checking for existing social account", { baseSocialId });
			const existingSocialUser = await prisma.user.findUnique({
				where: { baseSocialId },
			});

			if (existingSocialUser) {
				console.warn("[auth.register] Social account already registered", { baseSocialId });
				return {
					error: "Social account already registered",
					message: "Registration failed",
				};
			}
		}

		console.info("[auth.register] Hashing password");
		const passwordHash = await bcrypt.hash(password, 10);

		console.info("[auth.register] Generating EOA account");
		const { privateKey, address: eoaAddress } = generateAccount();
		const encryptedKey = encrypt(privateKey);

		console.info("[auth.register] Creating user in database", { email, eoaAddress });
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
		console.info("[auth.register] Registration successful", { userId: user.id });

		return {
			message: "User registered successfully",
			userId: user.id,
		};
	} catch (error: unknown) {
		console.error("[auth.register] Registration error:", error);
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
			console.debug("[auth.getCurrentUser] No userId in session");
			return null;
		}

		console.debug("[auth.getCurrentUser] Fetching user", { userId });

		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: {
				id: true,
				email: true,
				onboarded: true,
			},
		});

		if (user) {
			console.debug("[auth.getCurrentUser] User found", { userId: user.id });
		} else {
			console.warn("[auth.getCurrentUser] No user found in database", { userId });
		}

		return user;
	} catch (error) {
		console.error("[auth.getCurrentUser] Error:", error);
		return null;
	}
}
