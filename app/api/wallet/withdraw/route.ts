import { NextResponse } from "next/server";
import { withdraw } from "@/app/server";
import { WalletResponse } from "@/types";

export async function POST(
	request: Request,
): Promise<NextResponse<WalletResponse>> {
	const body = await request.json();
	const result = await withdraw(body);

	if (result.error) {
		const status =
			result.message === "Validation failed"
				? 400
				: result.message === "Withdrawal failed" && result.error === "Wallet not found"
					? 404
					: result.message === "Withdrawal failed" && result.error?.includes("Daily limit")
						? 403
						: result.message === "Withdrawal failed"
							? 400
							: 500;
		return NextResponse.json(result, { status });
	}

	return NextResponse.json(result);
}
