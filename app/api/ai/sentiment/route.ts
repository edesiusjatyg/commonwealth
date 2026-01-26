import { NextResponse } from "next/server";
import { getSentiment } from "@/app/server";
import { SentimentResponse } from "@/types";

export async function POST(
	request: Request,
): Promise<NextResponse<SentimentResponse>> {
	const body = await request.json();
	const result = await getSentiment(body);

	if ((result as any).error) {
		return NextResponse.json(result, { status: 502 });
	}

	return NextResponse.json(result);
}
