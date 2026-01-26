import { NextResponse } from "next/server";
import { getOnboardingSteps } from "@/app/server";
import { OnboardingResponse } from "@/types";

export async function GET(): Promise<NextResponse<OnboardingResponse>> {
	const result = await getOnboardingSteps();
	return NextResponse.json(result);
}
