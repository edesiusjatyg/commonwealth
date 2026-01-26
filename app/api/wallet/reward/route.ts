import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { WalletResponse } from "@/types";

const rewardSchema = z.object({
	walletId: z.string(),
	amount: z.number().positive(),
});

export async function POST(
	request: Request,
): Promise<NextResponse<WalletResponse>> {
	// Check if wallet exists
	// Check if amount is positive - wip
	// Create yield transaction
	// Send notification
	// Return success response

	try {
		const body = await request.json();
		const validatedData = rewardSchema.safeParse(body);

		if (!validatedData.success) {
			return NextResponse.json(
				{
					error: z.treeifyError(validatedData.error).errors[0],
					message: "Validation failed",
				},
				{ status: 400 },
			);
		}

		const { walletId, amount } = validatedData.data;

		const wallet = await prisma.wallet.findUnique({
			where: { id: walletId },
		});

		if (!wallet)
			return NextResponse.json(
				{ error: "Wallet not found", message: "Reward processing failed" },
				{ status: 404 },
			);

		await prisma.transaction.create({
			data: {
				walletId,
				type: "YIELD",
				amount,
				category: "REWARD",
				description: "Weekly staking reward",
			},
		});

		await prisma.notification.create({
			data: {
				userId: wallet.userId,
				title: "Reward Received!",
				message: `Your wallet just received a weekly yield of USD ${amount}.`,
				type: "REWARD_RECEIVED",
			},
		});

		return NextResponse.json({
			message: "Reward processed successfully",
			walletId: wallet.id,
		});
	} catch (error: any) {
		console.error("Reward error:", error);
		return NextResponse.json(
			{ error: "Internal server error", message: "System error" },
			{ status: 500 },
		);
	}
}
