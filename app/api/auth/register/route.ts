import { NextResponse } from "next/server";
import { register } from "@/app/server";
import { AuthResponse } from "@/types";

export async function POST(
	request: Request,
): Promise<NextResponse<AuthResponse>> {
	const body = await request.json();
	const result = await register(body);

	if (result.error) {
		const status =
			result.message === "Validation failed" || result.message === "Registration failed"
				? 400
				: 500;
		return NextResponse.json(result, { status });
	}

	return NextResponse.json(result, { status: 201 });
}
