import { NextResponse } from "next/server";
import { getNotifications, markNotificationRead } from "@/app/server";
import { NotificationsResponse } from "@/types";

export async function GET(
	request: Request,
): Promise<NextResponse<NotificationsResponse>> {
	const { searchParams } = new URL(request.url);
	const userId = searchParams.get("userId");

	if (!userId) {
		return NextResponse.json(
			{ error: "User ID is required", notifications: [] },
			{ status: 400 },
		);
	}

	const result = await getNotifications({ userId });

	if (result.error) {
		return NextResponse.json(result, { status: 500 });
	}

	return NextResponse.json(result);
}

export async function PATCH(
	request: Request,
): Promise<NextResponse<{ message: string; error?: string }>> {
	const body = await request.json();
	const result = await markNotificationRead(body);

	if (result.error) {
		return NextResponse.json(result, { status: 500 });
	}

	return NextResponse.json(result);
}
