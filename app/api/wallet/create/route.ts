import { NextResponse } from "next/server";
import { createWallet } from "@/app/server";
import { WalletResponse } from "@/types";

export async function POST(
	request: Request,
): Promise<NextResponse<WalletResponse>> {
	const body = await request.json();
	const result = await createWallet(body);

	if (result.error) {
		const status =
			result.message === "Validation failed"
				? 400
				: result.message === "Wallet creation failed"
					? 404
					: 500;
		return NextResponse.json(result, { status });
	}

	return NextResponse.json(result, { status: 201 });
}
