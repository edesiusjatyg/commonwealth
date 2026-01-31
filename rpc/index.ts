// RPC Layer - Transport functions that call server actions
// This layer sits between hooks and server actions

import { delayedValue } from "@/lib/utils";
import {
	getExpenses,
	withdraw as withdrawAction,
	getNotifications as getNotificationsAction,
	markNotificationRead as markNotificationReadAction,
	login as loginAction,
	register as registerAction,
	logout as logoutAction,
	getInsight as getInsightAction,
	getProfile as getProfileAction,
	updateProfile as updateProfileAction,
	getContacts,
	saveContactAction,
	initiateTransfer,
	getRewardsHistory,
	getCurrentWallet,
	getCurrentUser,
	createWallet,
	requestDailyLimitUnlock,
} from "@/app/server";
import type {
	ProfileResponse as ServerProfileResponse,
	UpdateProfileResponse as ServerUpdateProfileResponse,
	UpdateProfileInput as ServerUpdateProfileInput,
} from "@/app/server";
import type {
	BalanceResponse,
	TransactionRecord,
	WalletResponse,
	NotificationsResponse,
	AuthResponse,
} from "@/types";
import type { MarkNotificationReadResponse } from "@/app/server/notifications";
import type { LoginInput, RegisterInput } from "@/app/server/auth";

export type TransferredAccountDTO = {
	name: string;
	accountNumber: string;
	ethAddress: string;
	avatarUrl?: string;
};

export const getTransferredAccounts: () => Promise<TransferredAccountDTO[]> =
	async () => {
		const contacts = await getContacts();
		return contacts.map((c) => ({
			name: c.name,
			accountNumber: "", // In current schema accountNumber is not relevant for crypto contacts
			ethAddress: c.ethAddress,
		}));
	};

export type TransferDTO = {
	walletId: string;
	destinationAddress: string;
	amount: number;
	password?: string;
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

// Transfer crypto via server action
export const transferCrypto = async (
	data: TransferDTO,
): Promise<TransferResultDTO> => {
	const response = await initiateTransfer({
		walletId: data.walletId,
		destinationAddress: data.destinationAddress,
		amount: data.amount,
		category: data.category || "Transfer",
		description: data.description,
	});

	if (response.error) {
		throw new Error(response.error);
	}

	return {
		transactionId: `0x${Math.random().toString(16).slice(2)}`, // Placeholder until we have real tx hashes
		amount: data.amount,
		fee: 0, // Fee calculation would happen on-chain
		timestamp: Date.now(),
		destinationAddress: data.destinationAddress,
	};
};

export type WalletInsightDTO = {
	insight: string;
};

// Import from server actions
import { getOracleInsight } from "@/app/server";

// Default insight when user is not logged in or no data available
const defaultInsight =
	"Welcome to The Oracle. Connect your wallet to receive personalized insights about your portfolio and spending patterns.";

export const getWalletInsight = async (
	userId?: string,
): Promise<WalletInsightDTO> => {
	// If no userId provided, return default insight
	if (!userId) {
		return await delayedValue({ insight: defaultInsight }, 300);
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

export const getRewards = async (walletId?: string): Promise<RewardDTO[]> => {
	if (!walletId) return [];

	const history = await getRewardsHistory(walletId);

	return history.map((h) => ({
		id: h.id,
		amount: h.amount,
		currency: "IDR", // Assuming IDR for now
		interestRate: 5.5, // Static APR for UI matching
		periodStart: h.timestamp.getTime() - 30 * 24 * 60 * 60 * 1000,
		periodEnd: h.timestamp.getTime(),
		status: "credited",
		timestamp: h.timestamp.getTime(),
	}));
};

// Save Contact
export type SaveContactDTO = {
	name: string;
	walletAddress: string;
};

export const saveContact = async (data: SaveContactDTO): Promise<void> => {
	const response = await saveContactAction({
		name: data.name,
		walletAddress: data.walletAddress,
	});

	if (!response.success) {
		throw new Error(response.error || "Failed to save contact");
	}
};

// ============================================
// Server Action Integration - Wallet Operations
// ============================================

// Get wallet balance and transaction history via server action
export const getWalletBalance = async (
	walletId: string,
): Promise<BalanceResponse> => {
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
export const withdrawFunds = async (
	input: WithdrawInput,
): Promise<WalletResponse> => {
	return await withdrawAction(input);
};

export type GetTransactionHistoryInput = {
	walletId: string;
	start: string; // iso date string
	end: string; // iso date string
};

export type GetTransactionHistoryOutput = {
	transactions: TransactionRecord[];
};

// Get transaction history via server action with date filtering
export const getTransactionHistory = async ({
	walletId,
	start,
	end,
}: GetTransactionHistoryInput): Promise<GetTransactionHistoryOutput> => {
	// Fetch transactions from server action with date filters
	const response = await getExpenses({
		walletId,
		startDate: start,
		endDate: end,
	});

	if (response.error) {
		throw new Error(response.error);
	}

	return {
		transactions: response.history,
	};
};

// ============================================
// Server Action Integration - Notifications
// ============================================

// Get notifications for a user via server action
export const fetchNotifications = async (
	userId: string,
): Promise<NotificationsResponse> => {
	return await getNotificationsAction({ userId });
};

// Mark notification as read via server action
export const markNotificationAsRead = async (
	notificationId: string,
): Promise<MarkNotificationReadResponse> => {
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
export const registerUser = async (
	input: RegisterInput,
): Promise<AuthResponse> => {
	return await registerAction(input);
};

// Logout user via server action
export const logoutUser = async (): Promise<AuthResponse> => {
	return await logoutAction();
};

// ============================================
// Profile - Server Action Integration
// ============================================

// Re-export types from server for UI consumption
export type ProfileResponse = ServerProfileResponse;
export type UpdateProfileInput = ServerUpdateProfileInput;
export type UpdateProfileResponse = ServerUpdateProfileResponse;

// Get profile data for a wallet via server action
export const fetchProfile = async (
	walletId: string,
): Promise<ProfileResponse> => {
	return await getProfileAction({ walletId });
};

// Update profile data via server action
export const updateProfileData = async (
	input: UpdateProfileInput,
): Promise<UpdateProfileResponse> => {
	return await updateProfileAction(input);
};

// Get wallet address for deposit (uses profile data)
export const getWalletAddress = async (
	walletId: string,
): Promise<{ address: string }> => {
	const profile = await getProfileAction({ walletId });
	if (profile.error) {
		throw new Error(profile.error);
	}
	return { address: profile.walletAddress };
};

// Get the currently active wallet for the session
export const fetchCurrentWallet = async () => {
	return await getCurrentWallet();
};

// Get the currently active user for the session
export const fetchCurrentUser = async () => {
	return await getCurrentUser();
};

// Emergency contact management removed - now handled via updateProfile with emergencyEmail array

export type SetupWalletInput = {
	userId: string;
	name: string;
	emergencyEmail?: string | string[];
	dailyLimit: number;
};

export const setupWallet = async (
	input: SetupWalletInput,
): Promise<WalletResponse> => {
	return await createWallet(input);
};

export const requestDailyLimitApproval = async (walletId: string) => {
	return await requestDailyLimitUnlock(walletId);
};
