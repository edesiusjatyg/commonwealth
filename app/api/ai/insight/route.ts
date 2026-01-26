import { NextResponse } from "next/server";
import { generateInsight, getInsight } from "@/app/server";
import { InsightResponse } from "@/types";

export async function POST(
	request: Request,
): Promise<NextResponse<InsightResponse>> {
	const body = await request.json();
	const result = await generateInsight(body);

	if (result.error) {
		return NextResponse.json(result, { status: 502 });
	}

	return NextResponse.json(result);
}

export async function GET(
	request: Request,
): Promise<NextResponse<InsightResponse>> {
	const { searchParams } = new URL(request.url);
	const userId = searchParams.get("userId");

	if (!userId) {
		return NextResponse.json(
			{ error: "User ID required", insight_text: "", confidence: 0 },
			{ status: 400 },
		);
	}

	const result = await getInsight({ userId });

	if (result.error) {
		return NextResponse.json(result, { status: 404 });
	}

	return NextResponse.json(result);
}
