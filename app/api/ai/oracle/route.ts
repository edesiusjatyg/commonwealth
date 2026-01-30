import { NextResponse } from "next/server";
import { getOracleInsight, OracleInsightResponse } from "@/app/server";

export async function GET(
	request: Request,
): Promise<NextResponse<OracleInsightResponse>> {
	const { searchParams } = new URL(request.url);
	const userId = searchParams.get("userId");

	if (!userId) {
		return NextResponse.json(
			{
				insight: "Welcome to The Oracle. Please sign in to receive personalized insights.",
				confidence: 0,
			},
			{ status: 200 },
		);
	}

	const result = await getOracleInsight({ userId });

	if (result.error) {
		return NextResponse.json(result, { status: 502 });
	}

	return NextResponse.json(result);
}
