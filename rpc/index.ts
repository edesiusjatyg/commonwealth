// RPC Layer - Transport functions that call server actions
// This layer sits between hooks and server actions

import { delayedValue } from "@/lib/utils";
import { getExpenses, withdraw as withdrawAction, getNotifications as getNotificationsAction, markNotificationRead as markNotificationReadAction, login as loginAction, register as registerAction, logout as logoutAction } from "@/app/server";
import type { BalanceResponse, TransactionRecord, WalletResponse, NotificationsResponse, AuthResponse } from "@/types";
import type { MarkNotificationReadResponse } from "@/app/server/notifications";
import type { LoginInput, RegisterInput } from "@/app/server/auth";

export type TransferredAccountDTO = {
	name: string;
	accountNumber: string;
	ethAddress: string;
	avatarUrl?: string;
};

const accountsVal = [
  {
    name: "Alice Johnson",
    accountNumber: "1234567890",
    ethAddress: "0x8b7d0E0F9E8A6F5C3B2D1A4E6C7F9A1B2D3E4F5A",
  },
  {
    name: "Bob Smith",
    accountNumber: "0987654321",
    ethAddress: "0x3F1A9E6C7D8B2E4F5A0C1D9B6E7A8F2C4D5B1E0A",
  },
  {
    name: "Emanuel Brown",
    accountNumber: "1122334455",
    ethAddress: "0xA4C2F9E1B6D8E5F7C3A0D9B2E6F1A8D5C7B4E9F",
  },
  {
    name: "Charlie Kirk",
    accountNumber: "1124434455",
    ethAddress: "0x6E9F4C7A5B1D2F8E0A3C9B4E7D6F1A8C2E5B9D",
  },
];

export const getTransferredAccounts: () => Promise<TransferredAccountDTO[]> =
	async () => {
		return await delayedValue(accountsVal);
	};

export type TransferDTO = {
	destinationAddress: string;
	amount: number;
	password: string;
	category?: string;
	description?: string;
};

export type TransferResultDTO = {
	transactionId: string;
	amount: number;
	fee: number;
	timestamp: number;
	destinationAddress: string;
};

// Simple mock - just return success data directly
export const transferCrypto = async (
	data: TransferDTO,
): Promise<TransferResultDTO> => {
	// Mock implementation with delay
	return await delayedValue(
		{
			transactionId: `0x${Math.random().toString(16).slice(2)}`,
			amount: data.amount,
			fee: data.amount * 0.001, // 0.1% fee
			timestamp: Date.now(),
			destinationAddress: data.destinationAddress,
		},
		1500,
	);
};

export type WalletInsightDTO = {
	insight: string;
};

// Import from server actions
import { getOracleInsight } from "@/app/server";

// Default insight when user is not logged in or no data available
const defaultInsight =
	"Welcome to The Oracle. Connect your wallet to receive personalized insights about your portfolio and spending patterns.";

export const getWalletInsight = async (userId?: string): Promise<WalletInsightDTO> => {
	// If no userId provided, return default insight
	if (!userId) {
		return await delayedValue(
			{ insight: defaultInsight },
			300,
		);
	}

	try {
		const result = await getOracleInsight({ userId });
		return {
			insight: result.insight || defaultInsight,
		};
	} catch (error) {
		console.error("Failed to fetch Oracle insight:", error);
		return {
			insight: defaultInsight,
		};
	}
};

// Rewards (Interest) types and RPC functions
export type RewardDTO = {
	id: string;
	amount: number;
	currency: string;
	interestRate: number; // Annual percentage rate
	periodStart: number; // timestamp
	periodEnd: number; // timestamp
	status: "credited" | "pending";
	timestamp: number; // when credited
};

const mockRewards: RewardDTO[] = [
	{
		id: "interest-001",
		amount: 12500,
		currency: "IDR",
		interestRate: 5.5,
		periodStart: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
		periodEnd: Date.now() - 1 * 24 * 60 * 60 * 1000, // 1 day ago
		status: "credited",
		timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000,
	},
	{
		id: "interest-002",
		amount: 11800,
		currency: "IDR",
		interestRate: 5.5,
		periodStart: Date.now() - 60 * 24 * 60 * 60 * 1000, // 60 days ago
		periodEnd: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
		status: "credited",
		timestamp: Date.now() - 30 * 24 * 60 * 60 * 1000,
	},
	{
		id: "interest-003",
		amount: 10200,
		currency: "IDR",
		interestRate: 5.0,
		periodStart: Date.now() - 90 * 24 * 60 * 60 * 1000, // 90 days ago
		periodEnd: Date.now() - 60 * 24 * 60 * 60 * 1000, // 60 days ago
		status: "credited",
		timestamp: Date.now() - 60 * 24 * 60 * 60 * 1000,
	},
	{
		id: "interest-004",
		amount: 13100,
		currency: "IDR",
		interestRate: 5.5,
		periodStart: Date.now(),
		periodEnd: Date.now() + 30 * 24 * 60 * 60 * 1000, // in 30 days
		status: "pending",
		timestamp: Date.now(),
	},
];

export const getRewards = async (): Promise<RewardDTO[]> => {
	return await delayedValue(mockRewards, 1000);
};

// Wallet Address for Deposit
export type WalletAddressDTO = {
	address: string;
};

export const getWalletAddress = async (): Promise<WalletAddressDTO> => {
	return await delayedValue(
		{ address: "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD73" },
		500,
	);
};

// Save Contact
export type SaveContactDTO = {
	name: string;
   walletAddress: string;
};

export const saveContact = async (data: SaveContactDTO): Promise<void> => {
	// Mock implementation - in real app this would persist to backend
	await delayedValue(undefined, 500);
};

// Mock transaction history data
const mockTransactionHistory: TransactionRecord[] = [
	{
		id: "tx-001",
		walletId: "mock-wallet-id",
		type: "DEPOSIT",
		amount: 5000000,
		category: "Salary",
		description: "Monthly salary deposit",
		createdAt: new Date("2026-01-15T10:30:00Z"),
	},
	{
		id: "tx-002",
		walletId: "mock-wallet-id",
		type: "WITHDRAWAL",
		amount: 150000,
		category: "Food",
		description: "Grocery shopping",
		createdAt: new Date("2026-01-18T14:20:00Z"),
	},
	{
		id: "tx-003",
		walletId: "mock-wallet-id",
		type: "WITHDRAWAL",
		amount: 500000,
		category: "Transportation",
		description: "Monthly transport pass",
		createdAt: new Date("2026-01-20T09:15:00Z"),
	},
	{
		id: "tx-004",
		walletId: "mock-wallet-id",
		type: "YIELD",
		amount: 25000,
		category: "Interest",
		description: "Daily interest earned",
		createdAt: new Date("2026-01-21T00:00:00Z"),
	},
	{
		id: "tx-005",
		walletId: "mock-wallet-id",
		type: "WITHDRAWAL",
		amount: 200000,
		category: "Entertainment",
		description: "Movie tickets and dinner",
		createdAt: new Date("2026-01-22T19:45:00Z"),
	},
	{
		id: "tx-006",
		walletId: "mock-wallet-id",
		type: "DEPOSIT",
		amount: 1000000,
		category: "Transfer",
		description: "Received from friend",
		createdAt: new Date("2026-01-23T16:30:00Z"),
	},
	{
		id: "tx-007",
		walletId: "mock-wallet-id",
		type: "WITHDRAWAL",
		amount: 75000,
		category: "Shopping",
		description: "Online purchase",
		createdAt: new Date("2026-01-24T11:00:00Z"),
	},
	{
		id: "tx-008",
		walletId: "mock-wallet-id",
		type: "YIELD",
		amount: 18500,
		category: "Interest",
		description: "Daily interest earned",
		createdAt: new Date("2026-01-25T00:00:00Z"),
	},
];

// ============================================
// Server Action Integration - Wallet Operations
// ============================================

// Get wallet balance and transaction history via server action
export const getWalletBalance = async (walletId: string): Promise<BalanceResponse> => {
	return await getExpenses({ walletId });
};

// Withdraw input type for RPC layer
export type WithdrawInput = {
	walletId: string;
	amount: number;
	category: string;
	password?: string;
	description?: string;
};

// Withdraw funds via server action
export const withdrawFunds = async (input: WithdrawInput): Promise<WalletResponse> => {
	return await withdrawAction(input);
};

export type GetTransactionHistoryInput = {
   walletId: string;
   start: string; // iso date string
   end: string; // iso date string
}

export type GetTransactionHistoryOutput = {
   transactions: TransactionRecord[];
}

export const getTransactionHistory = async ({
	walletId, // Not used in mock - all transactions use same mock wallet
	start,
	end,
}: GetTransactionHistoryInput): Promise<GetTransactionHistoryOutput> => {
	// Filter transactions by date range
	const startDate = new Date(start);
	const endDate = new Date(end);
	
	const filteredTransactions = mockTransactionHistory.filter((tx) => {
		const txDate = new Date(tx.createdAt);
		return txDate >= startDate && txDate <= endDate;
	});

	return await delayedValue(
		{
			transactions: filteredTransactions,
		},
		800,
	);
};

// ============================================
// Server Action Integration - Notifications
// ============================================

// Get notifications for a user via server action
export const fetchNotifications = async (userId: string): Promise<NotificationsResponse> => {
	return await getNotificationsAction({ userId });
};

// Mark notification as read via server action
export const markNotificationAsRead = async (notificationId: string): Promise<MarkNotificationReadResponse> => {
	return await markNotificationReadAction({ notificationId });
};

// ============================================
// Server Action Integration - Authentication
// ============================================

// Login user via server action
export const loginUser = async (input: LoginInput): Promise<AuthResponse> => {
	return await loginAction(input);
};

// Register user via server action
export const registerUser = async (input: RegisterInput): Promise<AuthResponse> => {
	return await registerAction(input);
};

// Logout user via server action
export const logoutUser = async (): Promise<AuthResponse> => {
	return await logoutAction();
};

// ============================================
// Profile - Mock Implementation
// When server actions are ready, replace with actual calls
// ============================================

// Profile response type
export type ProfileResponse = {
	email: string;
	nickname: string;
	dailyLimit: number;
	emergencyEmail: string | null;
	walletAddress: string;
	error?: string;
	message?: string;
};

// Update profile input type
export type UpdateProfileInput = {
	walletId: string;
	nickname?: string;
	dailyLimit?: number;
	emergencyEmail?: string | null;
};

// Update profile response type
export type UpdateProfileResponse = {
	success: boolean;
	error?: string;
	message?: string;
};

// Mock profile data
const mockProfileData: Omit<ProfileResponse, "error" | "message"> = {
	email: "user@example.com",
	nickname: "My Wallet",
	dailyLimit: 1000000,
	emergencyEmail: "emergency@example.com",
	walletAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD73",
};

// Get profile data for a wallet (mock implementation)
export const fetchProfile = async (walletId: string): Promise<ProfileResponse> => {
	// Mock delay to simulate network request
	await new Promise((resolve) => setTimeout(resolve, 800));
	
	// TODO: Replace with server action call when ready
	// return await getProfileAction({ walletId });
	
	return mockProfileData;
};

// Update profile data (mock implementation)
export const updateProfileData = async (input: UpdateProfileInput): Promise<UpdateProfileResponse> => {
	// Mock delay to simulate network request
	await new Promise((resolve) => setTimeout(resolve, 1000));
	
	// TODO: Replace with server action call when ready
	// return await updateProfileAction(input);
	
	console.log("Profile update mock - received:", input);
	
	return {
		success: true,
		message: "Profile updated successfully",
	};
};