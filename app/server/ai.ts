"use server";

import { ChatResponse, InsightResponse, SentimentResponse } from "@/types";
import axios from "axios";
import { z } from "zod";

const INSIGHTS_SERVICE_URL =
	process.env.USER_INSIGHTS_SERVICE_URL || "http://localhost:8001";
const SENTIMENT_SERVICE_URL =
	process.env.MARKET_SENTIMENT_SERVICE_URL || "http://localhost:8000";

// Input schemas
const chatSchema = z.object({
	message: z.string().min(1, "Message is required"),
});

const generateInsightSchema = z.object({
	userId: z.string().min(1, "User ID is required"),
	transactionsData: z.any(),
});

const getInsightSchema = z.object({
	userId: z.string().min(1, "User ID is required"),
});

const getSentimentSchema = z.object({
	token: z.string().min(1, "Token is required"),
	timeframe: z.string().optional(),
});

// Input types
export type ChatInput = z.infer<typeof chatSchema>;
export type GenerateInsightInput = z.infer<typeof generateInsightSchema>;
export type GetInsightInput = z.infer<typeof getInsightSchema>;
export type GetSentimentInput = z.infer<typeof getSentimentSchema>;

/**
 * Chat with AI assistant
 */
export async function chat(input: ChatInput): Promise<ChatResponse> {
	try {
		const validatedData = chatSchema.safeParse(input);

		if (!validatedData.success) {
			return {
				error: z.treeifyError(validatedData.error).errors[0],
				reply: "",
			};
		}

		const { message } = validatedData.data;

		// This is a placeholder for the AI Chatbot logic.
		// In a real implementation, this would call Gemini and
		// potentially return structured data for charts.

		return {
			reply: `I've received your message: "${message}". I can help you analyze your spending or check market sentiment for any token.`,
			charts: [
				{ type: "line", title: "Spending Trend", data: [10, 20, 15, 30] },
			],
		};
	} catch (error: any) {
		console.error("Chat error:", error);
		return { error: "Chat service unavailable", reply: "" };
	}
}

/**
 * Generate AI insight from transaction data
 */
export async function generateInsight(
	input: GenerateInsightInput,
): Promise<InsightResponse> {
	try {
		const validatedData = generateInsightSchema.safeParse(input);

		if (!validatedData.success) {
			return {
				error: z.treeifyError(validatedData.error).errors[0],
				insight_text: "",
				confidence: 0,
			};
		}

		const { userId, transactionsData } = validatedData.data;

		const response = await axios.post(
			`${INSIGHTS_SERVICE_URL}/insights/generate`,
			{
				transactions_data: transactionsData,
			},
			{
				params: { user_id: userId },
			},
		);

		return response.data;
	} catch (error: any) {
		console.error("AI Insight generation error:", error.message);
		return {
			error: "AI Insights Service unreachable",
			insight_text: "",
			confidence: 0,
		};
	}
}

/**
 * Get existing AI insight for a user
 */
export async function getInsight(
	input: GetInsightInput,
): Promise<InsightResponse> {
	try {
		const validatedData = getInsightSchema.safeParse(input);

		if (!validatedData.success) {
			return {
				error: z.treeifyError(validatedData.error).errors[0],
				insight_text: "",
				confidence: 0,
			};
		}

		const { userId } = validatedData.data;

		const response = await axios.get(
			`${INSIGHTS_SERVICE_URL}/insights/${userId}`,
		);
		return response.data;
	} catch (error: any) {
		console.error("AI Insight fetch error:", error.message);
		return { error: "Insight not found", insight_text: "", confidence: 0 };
	}
}

/**
 * Get market sentiment for a token
 */
export async function getSentiment(
	input: GetSentimentInput,
): Promise<SentimentResponse> {
	try {
		const validatedData = getSentimentSchema.safeParse(input);

		if (!validatedData.success) {
			return {
				error: z.treeifyError(validatedData.error).errors[0],
			} as any;
		}

		const { token, timeframe } = validatedData.data;

		const response = await axios.post(
			`${SENTIMENT_SERVICE_URL}/api/v1/sentiment`,
			{
				token,
				timeframe: timeframe || "3d",
			},
		);

		return response.data;
	} catch (error: any) {
		console.error("AI Sentiment error:", error.message);
		return { error: "Market Sentiment Service unreachable" } as any;
	}
}
