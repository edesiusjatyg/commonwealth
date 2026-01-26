import z from "zod";

export const bankAccountSchema = z
	.string()
	.trim()
	.min(8, "Bank account number is too short")
	.max(34, "Bank account number is too long")
	.regex(
		/^[A-Za-z0-9\s]+$/,
		"Bank account number may only contain letters and numbers",
	)
	.transform((v: string) => v.toUpperCase().replace(/\s+/g, ""));

export const ethAddressSchema = z
	.string()
	.trim()
	.regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address")
	.transform((v) => v.toLowerCase());

export type Result<T, E> =
	| { success: true; data: T }
	| { success: false; error: E };
