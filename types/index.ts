import z from "zod";
import { TransactionType, NotificationType } from '@prisma/client';

export const bankAccountSchema = z
	.string()
	.trim()
	.min(8, "Bank account number is too short")
	.max(34, "Bank account number is too long")
	.regex(
		/^[A-Za-z0-9\s]+$/,
		"Bank account number may only contain letters and numbers",
	)
	.transform((v: string) => v.toUpperCase().replace(/\s+/g, ""));

export const ethAddressSchema = z
	.string()
	.trim()
	.regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address")
	.transform((v) => v.toLowerCase());

export type Result<T, E> =
	| { success: true; data: T }
	| { success: false; error: E };

// Auth Types
export interface AuthResponse {
	message: string;
	userId?: string;
	onboarded?: boolean;
	error?: string;
}

// Onboarding Types
export interface OnboardingStep {
	id: number;
	title: string;
	description: string;
	image: string;
}

export interface OnboardingResponse {
	steps: OnboardingStep[];
}

// Wallet Types
export interface WalletResponse {
	message: string;
	walletId?: string;
	address?: string;
	error?: string;
}

export interface BalanceResponse {
	balance: number;
	history: TransactionRecord[];
	totalDeposits: number;
	totalWithdrawals: number;
	error?: string;
}

// Transaction/Expense Types
export interface TransactionRecord {
	id: string;
	walletId: string;
	type: TransactionType;
	amount: number | string;
	category: string | null;
	description: string | null;
	createdAt: Date | string;
}

// AI Types
export interface SentimentResponse {
	sentiment: 'bullish' | 'neutral' | 'bearish';
	confidence: number;
	summary: string;
	cited_sources: Array<{
		title: string;
		url: string;
		date?: string;
	}>;
}

export interface InsightResponse {
	insight_text: string;
	confidence: number;
	metadata?: any;
}

export interface ChatResponse {
	reply: string;
	charts?: Array<{
		type: string;
		title: string;
		data: any;
	}>;
}

// Notification Types
export interface NotificationRecord {
	id: string;
	userId: string;
	title: string;
	message: string;
	type: NotificationType;
	read: boolean;
	createdAt: Date | string;
}

export interface NotificationsResponse {
	notifications: NotificationRecord[];
}
