import { NextResponse } from "next/server";
import { logout } from "@/app/server";
import { AuthResponse } from "@/types";

export async function POST(): Promise<NextResponse<AuthResponse>> {
	const result = await logout();
	return NextResponse.json(result);
}
