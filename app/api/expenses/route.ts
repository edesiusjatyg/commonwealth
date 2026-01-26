import { NextResponse } from "next/server";
import { getExpenses } from "@/app/server";
import { BalanceResponse } from "@/types";

export async function GET(request: Request): Promise<NextResponse<BalanceResponse>> {
	const { searchParams } = new URL(request.url);
	const walletId = searchParams.get("walletId");

	if (!walletId) {
		return NextResponse.json(
			{
				error: "Wallet ID is required",
				balance: 0,
				history: [],
				totalDeposits: 0,
				totalWithdrawals: 0,
			},
			{ status: 400 },
		);
	}

	const result = await getExpenses({ walletId });

	if (result.error) {
		return NextResponse.json(result, { status: 500 });
	}

	return NextResponse.json(result);
}
