import { NextResponse } from "next/server";
import { chat } from "@/app/server";
import { ChatResponse } from "@/types";

export async function POST(
	request: Request,
): Promise<NextResponse<ChatResponse>> {
	const body = await request.json();
	const result = await chat(body);

	if (result.error) {
		return NextResponse.json(result, { status: 500 });
	}

	return NextResponse.json(result);
}
