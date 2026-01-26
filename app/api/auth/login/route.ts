import { NextResponse } from "next/server";
import { login } from "@/app/server";
import { AuthResponse } from "@/types";

export async function POST(request: Request): Promise<NextResponse<AuthResponse>> {
	const body = await request.json();
	const result = await login(body);

	if (result.error) {
		const status =
			result.message === "Validation failed"
				? 400
				: result.message === "Login failed"
					? 401
					: 500;
		return NextResponse.json(result, { status });
	}

	return NextResponse.json(result);
}
