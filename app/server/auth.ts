"use server";

import { prisma } from "@/lib/prisma";
import { AuthResponse } from "@/types";
import bcrypt from "bcryptjs";
import { z } from "zod";

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
				error: z.treeifyError(validatedData.error).errors[0],
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

		// Set cookie/token here
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
	// WIP
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
				error: z.treeifyError(validatedData.error).errors[0],
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

		const user = await prisma.user.create({
			data: {
				email,
				passwordHash,
				baseSocialId,
			},
		});

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
