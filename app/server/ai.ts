"use server";

import { ChatResponse, InsightResponse, SentimentResponse } from "@/types";
import axios from "axios";
import { z } from "zod";

const INSIGHTS_SERVICE_URL = process.env.USER_INSIGHTS_SERVICE_URL;
const SENTIMENT_SERVICE_URL = process.env.MARKET_SENTIMENT_SERVICE_URL;
const CHATBOT_SERVICE_URL = process.env.CHATBOT_SERVICE_URL;

if (!INSIGHTS_SERVICE_URL) {
	console.warn("USER_INSIGHTS_SERVICE_URL not set");
}

if (!SENTIMENT_SERVICE_URL) {
	console.warn("MARKET_SENTIMENT_SERVICE_URL not set");
}

if (!CHATBOT_SERVICE_URL) {
	console.warn("CHATBOT_SERVICE_URL not set");
}

// Input schemas
const chatSchema = z.object({
	user_message: z.string().min(1, "Message is required"),
	session_id: z.string().nullable().optional(),
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
 * Chat with AI assistant - proxies to chatbot microservice
 */
export async function chat(input: ChatInput): Promise<ChatResponse> {
	try {
		const validatedData = chatSchema.safeParse(input);

		if (!validatedData.success) {
			return {
				error: validatedData.error.issues[0].message,
				data: null,
				suggested_next_prompts: [],
				meta: null,
			} as any;
		}

		const { user_message, session_id } = validatedData.data;

		const response = await axios.post(
			`${CHATBOT_SERVICE_URL}/chat`,
			{
				user_message,
				session_id: session_id || null,
			},
		);

		return response.data;
	} catch (error: any) {
		console.error("Chat error:", error.message);
		return { 
			error: "Chat service unavailable", 
			data: null,
			suggested_next_prompts: [],
			meta: null,
		} as any;
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
				error: validatedData.error.issues[0].message,
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
				error: validatedData.error.issues[0].message,
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
				error: validatedData.error.issues[0].message,
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

// ============================================
// The Oracle - AI Wallet Insights
// ============================================

import { getOracleContext, formatOracleContextForPrompt } from "@/lib/db";

const oracleInsightSchema = z.object({
	userId: z.string().min(1, "User ID is required"),
});

export type OracleInsightInput = z.infer<typeof oracleInsightSchema>;

export type OracleInsightResponse = {
	insight: string;
	confidence?: number;
	error?: string;
};

/**
 * Get personalized wallet insight from The Oracle
 * Fetches context from Neon DB and generates AI insight
 */
export async function getOracleInsight(
	input: OracleInsightInput,
): Promise<OracleInsightResponse> {
	try {
		const validatedData = oracleInsightSchema.safeParse(input);

		if (!validatedData.success) {
			return {
				error: validatedData.error.issues[0].message,
				insight: "",
			};
		}

		const { userId } = validatedData.data;

		// Fetch context from Neon DB (read-only)
		const context = await getOracleContext(userId);

		if (!context) {
			// Return a helpful default message if no wallet data
			return {
				insight: "Welcome to The Oracle. Connect your wallet to receive personalized insights about your portfolio and spending patterns.",
				confidence: 0,
			};
		}

		// Format context for AI prompt
		const formattedContext = formatOracleContextForPrompt(context);

		// Try to call the insights service
		try {
			const response = await axios.post(
				`${INSIGHTS_SERVICE_URL}/api/v1/insights`,
				{
					user_id: userId,
					portfolio_tokens: [],
					context: formattedContext,
				},
			);

			if (response.data?.insight_text) {
				return {
					insight: response.data.insight_text,
					confidence: response.data.confidence || 75,
				};
			}
		} catch (serviceError) {
			// Service unavailable, generate local insight
			console.log("Insights service unavailable, generating local insight");
		}

		// Generate a local insight based on the context
		const insight = generateLocalOracleInsight(context);
		return {
			insight,
			confidence: 70,
		};
	} catch (error: any) {
		console.error("Oracle insight error:", error.message);
		return {
			error: "Unable to generate insight",
			insight: "The Oracle is currently unavailable. Please try again later.",
		};
	}
}

/**
 * Generate a local insight when the AI service is unavailable
 */
function generateLocalOracleInsight(context: import("@/lib/db").OracleContext): string {
	const { totalBalance, transactionSummary, recentTransactions } = context;
	const { totalDeposits, totalWithdrawals, totalYield, transactionCount } = transactionSummary;

	// Calculate net flow
	const netFlow = totalDeposits - totalWithdrawals;
	const yieldPercentage = totalDeposits > 0 ? ((totalYield / totalDeposits) * 100).toFixed(2) : 0;

	// Analyze recent spending categories
	const recentWithdrawals = recentTransactions.filter((tx) => tx.type === "WITHDRAWAL");
	const categorySpending = recentWithdrawals.reduce((acc, tx) => {
		const cat = tx.category || "Other";
		acc[cat] = (acc[cat] || 0) + tx.amount;
		return acc;
	}, {} as Record<string, number>);

	const topCategory = Object.entries(categorySpending).sort((a, b) => (b[1] as number) - (a[1] as number))[0];

	// Build insight
	const insights: string[] = [];

	if (totalBalance > 0) {
		insights.push(`Your wallet holds $${totalBalance.toLocaleString()}.`);
	}

	if (netFlow > 0) {
		insights.push(`Net positive flow of $${netFlow.toLocaleString()} this period.`);
	} else if (netFlow < 0) {
		insights.push(`Net outflow of $${Math.abs(netFlow).toLocaleString()} this period.`);
	}

	if (totalYield > 0) {
		insights.push(`You've earned $${totalYield.toLocaleString()} in yield (${yieldPercentage}% return).`);
	}

	if (topCategory) {
		insights.push(`Top spending category: ${topCategory[0]} ($${topCategory[1].toLocaleString()}).`);
	}

	if (transactionCount === 0) {
		return "Your wallet is ready. Start transacting to receive personalized insights.";
	}

	return insights.join(" ") || "Portfolio analysis in progress. Check back for insights.";
}

