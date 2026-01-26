import { NextResponse } from "next/server";
import { deposit } from "@/app/server";
import { WalletResponse } from "@/types";

export async function POST(
	request: Request,
): Promise<NextResponse<WalletResponse>> {
	const body = await request.json();
	const result = await deposit(body);

	if (result.error) {
		const status =
			result.message === "Validation failed"
				? 400
				: result.message === "Deposit failed"
					? 404
					: 500;
		return NextResponse.json(result, { status });
	}

	return NextResponse.json(result);
}
