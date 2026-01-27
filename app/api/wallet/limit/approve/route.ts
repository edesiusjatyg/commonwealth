import { NextResponse } from "next/server";
import { approveDailyLimit } from "@/app/server";
import { WalletResponse } from "@/types";

export async function POST(
	request: Request,
): Promise<NextResponse<WalletResponse>> {
	const body = await request.json();
	const result = await approveDailyLimit(body);

	if (result.error) {
		const status =
			result.message === "Validation failed"
				? 400
				: result.message === "Approval failed" && result.error === "Wallet not found"
					? 404
					: result.message === "Approval failed" && result.error === "Invalid approval code"
						? 403
						: 500;
		return NextResponse.json(result, { status });
	}

	return NextResponse.json(result);
}
