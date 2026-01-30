"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { z } from "zod";

// Input schemas
const saveContactSchema = z.object({
	name: z.string().min(1, "Contact name is required"),
	walletAddress: z.string().startsWith("0x", "Invalid wallet address"),
});

// Input types
export type SaveContactInput = z.infer<typeof saveContactSchema>;

// Response types
export type ContactDTO = {
	id: string;
	name: string;
	ethAddress: string;
};

export type SaveContactResponse = {
	success: boolean;
	error?: string;
	message?: string;
};

/**
 * Get all contacts for the current user
 */
export async function getContacts(): Promise<ContactDTO[]> {
	try {
		const userId = await getCurrentUserId();
		if (!userId) {
			return [];
		}

		const contacts = await prisma.contact.findMany({
			where: { userId },
			orderBy: { name: "asc" },
		});

		return contacts.map((c) => ({
			id: c.id,
			name: c.name,
			ethAddress: c.ethAddress,
		}));
	} catch (error) {
		console.error("Get contacts error:", error);
		return [];
	}
}

/**
 * Save a new contact for the current user
 */
export async function saveContactAction(input: SaveContactInput): Promise<SaveContactResponse> {
	try {
		const userId = await getCurrentUserId();
		if (!userId) {
			return { success: false, error: "Unauthorized" };
		}

		const validatedData = saveContactSchema.safeParse(input);
		if (!validatedData.success) {
			return {
				success: false,
				error: validatedData.error.issues[0].message,
			};
		}

		const { name, walletAddress } = validatedData.data;

		// Check if contact already exists for this address
		const existing = await prisma.contact.findFirst({
			where: {
				userId,
				ethAddress: walletAddress,
			},
		});

		if (existing) {
			// Update name if it already exists
			await prisma.contact.update({
				where: { id: existing.id },
				data: { name },
			});
		} else {
			// Create new contact
			await prisma.contact.create({
				data: {
					userId,
					name,
					ethAddress: walletAddress,
				},
			});
		}

		return {
			success: true,
			message: "Contact saved successfully",
		};
	} catch (error) {
		console.error("Save contact error:", error);
		return {
			success: false,
			error: "Internal server error",
		};
	}
}
