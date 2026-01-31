"use server";

import { OnboardingResponse, OnboardingStep } from "@/types";
import { prisma } from "@/lib/prisma";

/**
 * Get onboarding steps
 */
export async function getOnboardingSteps(): Promise<OnboardingResponse> {
	console.info("[onboarding.getOnboardingSteps] Fetching onboarding steps");

	const onboardingSteps: OnboardingStep[] = [
		{
			id: 1,
			title: "Welcome to CommonWealth",
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

	console.info("[onboarding.getOnboardingSteps] Steps fetched", {
		count: onboardingSteps.length
	});
	return { steps: onboardingSteps };
}

export async function completeOnboarding(userId: string): Promise<boolean> {
	console.info("[onboarding.completeOnboarding] Marking user as onboarded", { userId });

	try {
		const result = await prisma.user.update({
			where: { id: userId },
			data: { onboarded: true },
		});
		console.info("[onboarding.completeOnboarding] Onboarding completed", { userId });
		return !!result;
	} catch (error) {
		console.error("[onboarding.completeOnboarding] Error completing onboarding:", error);
		return false;
	}
}

