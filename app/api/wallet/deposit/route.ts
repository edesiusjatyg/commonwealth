import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { WalletResponse } from "@/types";

const depositSchema = z.object({
	walletId: z.string(),
	amount: z.number().positive("Amount must be positive"),
	category: z.string().min(1, "Category/Tag is required"),
});

export async function POST(
	request: Request,
): Promise<NextResponse<WalletResponse>> {
	// Check if wallet exists
	// Check if user exists - wip
	// Check if amount is positive - wip
	// Check if category is valid - wip
	// Create transaction record
	// Send notification
	// Return success response

	try {
		const body = await request.json();
		const validatedData = depositSchema.safeParse(body);

		if (!validatedData.success) {
			return NextResponse.json(
				{
					error: z.treeifyError(validatedData.error).errors[0],
					message: "Validation failed",
				},
				{ status: 400 },
			);
		}

		const { walletId, amount, category } = validatedData.data;

		const wallet = await prisma.wallet.findUnique({
			where: { id: walletId },
			include: { user: true },
		});

		if (!wallet) {
			return NextResponse.json(
				{ error: "Wallet not found", message: "Deposit failed" },
				{ status: 404 },
			);
		}

		const transaction = await prisma.transaction.create({
			data: {
				walletId,
				type: "DEPOSIT",
				amount: amount,
				category,
				description: `Deposit to wallet ${wallet.name}`,
			},
		});

		await prisma.notification.create({
			data: {
				userId: wallet.userId,
				title: "Deposit Successful",
				message: `You have successfully deposited USD ${amount} to your wallet.`,
				type: "DEPOSIT_SUCCESS",
			},
		});

		return NextResponse.json({
			message: "Deposit successful",
			walletId: wallet.id,
		});
	} catch (error: any) {
		console.error("Deposit error:", error);
		return NextResponse.json(
			{ error: "Internal server error", message: "System error" },
			{ status: 500 },
		);
	}
}
