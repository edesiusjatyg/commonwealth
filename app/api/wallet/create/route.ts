import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { WalletResponse } from "@/types";

const createWalletSchema = z.object({
	userId: z.string(),
	address: z.string().startsWith("0x", "Invalid wallet address"),
	name: z.string().min(1, "Wallet name is required"),
	emergencyEmail: z.string().email().optional(),
	dailyLimit: z.number().nonnegative().default(0),
});

export async function POST(
	request: Request,
): Promise<NextResponse<WalletResponse>> {
	// Check if user exists
	// Check if wallet address already exists
	// Create wallet
	// Return success response

	try {
		const body = await request.json();
		const validatedData = createWalletSchema.safeParse(body);

		if (!validatedData.success) {
			return NextResponse.json(
				{
					error: z.treeifyError(validatedData.error).errors[0],
					message: "Validation failed",
				},
				{ status: 400 },
			);
		}

		const { userId, address, name, emergencyEmail, dailyLimit } =
			validatedData.data;

		const user = await prisma.user.findUnique({
			where: { id: userId },
		});

		if (!user) {
			return NextResponse.json(
				{ error: "User not found", message: "Wallet creation failed" },
				{ status: 404 },
			);
		}

		const wallet = await prisma.wallet.create({
			data: {
				userId,
				address,
				name,
				emergencyEmail,
				dailyLimit,
			},
		});

		await prisma.user.update({
			where: { id: userId },
			data: { onboarded: true },
		});
		await prisma.notification.create({
			data: {
				userId,
				title: "Wallet Created",
				message: `Success! Your wallet "${name}" has been created.`,
				type: "DEPOSIT_SUCCESS",
			},
		});

		return NextResponse.json(
			{
				message: "Wallet created successfully",
				walletId: wallet.id,
				address: wallet.address,
			},
			{ status: 201 },
		);
	} catch (error: any) {
		console.error("Wallet creation error:", error);
		return NextResponse.json(
			{ error: "Internal server error", message: "System error" },
			{ status: 500 },
		);
	}
}
