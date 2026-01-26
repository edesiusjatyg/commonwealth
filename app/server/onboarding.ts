"use server";

import { OnboardingResponse, OnboardingStep } from "@/types";

/**
 * Get onboarding steps
 */
export async function getOnboardingSteps(): Promise<OnboardingResponse> {
	const onboardingSteps: OnboardingStep[] = [
		{
			id: 1,
			title: "Welcome to Blackwallet",
			description: "The most secure AI-powered DeFi wallet on Base L2.",
			image: "/onboarding/welcome.png",
		},
		{
			id: 2,
			title: "Smart Security",
			description:
				"Manage your assets with Multi-sig security and daily spending limits.",
			image: "/onboarding/security.png",
		},
		{
			id: 3,
			title: "AI Insights",
			description:
				"Get personalized financial advice and real-time market sentiment analysis.",
			image: "/onboarding/ai.png",
		},
	];

	return { steps: onboardingSteps };
}
