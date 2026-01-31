"use server";

import { prisma } from "@/lib/prisma";
import { WalletResponse } from "@/types";
import { getCurrentUserId } from "@/lib/session";
import { z } from "zod";
import { computeWalletAddress, deployWalletOnChain, resetDailyLimitOnChain } from "./chain";
import { sendApprovalEmail } from "./email";
import { Address } from "viem";
import crypto from "crypto";

// Input schemas
const createWalletSchema = z.object({
	userId: z.string(),
	name: z.string().min(1, "Wallet name is required"),
	emergencyEmail: z.union([
		z.string().email(),
		z.array(z.string().email())
	]).optional().transform(val => {
		if (!val) return [];
		return Array.isArray(val) ? val : [val];
	})
		.refine(val => val.length >= 1 && val.length <= 2, { message: "At least one and max 2 emergency contacts required" }),
	dailyLimit: z.number().nonnegative().default(0),
});

const depositSchema = z.object({
	walletId: z.string(),
	amount: z.number().positive("Amount must be positive"),
	category: z.string().min(1, "Category/Tag is required"),
});

const withdrawSchema = z.object({
	walletId: z.string(),
	amount: z.number().positive("Amount must be positive"),
	category: z.string().min(1, "Category/Tag is required"),
	password: z.string().optional(),
	description: z.string().optional(),
});

const approvalSchema = z.object({
	walletId: z.string(),
	approvalCode: z.string(),
});

const rewardSchema = z.object({
	walletId: z.string(),
	amount: z.number().positive(),
});

// Input types
export type CreateWalletInput = z.input<typeof createWalletSchema>;
export type DepositInput = z.infer<typeof depositSchema>;
export type WithdrawInput = z.infer<typeof withdrawSchema>;
export type ApproveDailyLimitInput = z.infer<typeof approvalSchema>;
export type ProcessRewardInput = z.infer<typeof rewardSchema>;

/**
 * Create a new wallet for a user
 */
export async function createWallet(
	input: CreateWalletInput,
): Promise<WalletResponse> {
	try {
		const validatedData = createWalletSchema.safeParse(input);

		if (!validatedData.success) {
			return {
				error: validatedData.error.issues[0].message,
				message: "Validation failed",
			};
		}

		const { userId, name, emergencyEmail, dailyLimit } =
			validatedData.data;

		const user = await prisma.user.findUnique({
			where: { id: userId },
		});

		if (!user || !user.eoaAddress) {
			return {
				error: "User EOA not found",
				message: "Wallet creation failed",
			};
		}

		// Prepare Contract Args
		const owners: Address[] = [user.eoaAddress as Address];
		const requiredSignatures = BigInt(1); // 1/1 for this MVP
		const dailyLimitBI = BigInt(Math.floor(dailyLimit * 1e18)); // Assume input is plain number, contract uses wei 18 decimals
		// Note: user input dailyLimit is number, we convert to wei if needed. 
		// Schema has dailyLimit as number. Let's assume it's USD or Token units. 
		// If USDT (6 decimals) or ETH (18). 
		// Detailed requirements said "Deposit USDT". USDT is 6 decimals.
		// "Daily Limit wallet". "Investasi BTC...".
		// We'll assume standard 18 decimals for limit for simplicity or mapped to USDT.
		// Let's use 18 decimals for now.
		const emergencyContactAddr = (user.eoaAddress as Address); // Self as emergency for MVP, or null? Struct requires address.
		// Requirement: "User dapat memasukkan email emergency contact".
		// This implies the contact is off-chain (email) for approval process?
		// And the system (relayer) acts as the on-chain enforcer/signer when approval is granted?
		// OR the emergency contact has an address?
		// "Sistem dapat memberi notifikasi status approval".
		// For MVP, we pass the user itself or the relayer as the "Emergency Contact" on chain, 
		// and the backend handles the email logic.

		const salt = BigInt(Math.floor(Math.random() * 1000000));

		const computedAddress = await computeWalletAddress(
			owners,
			requiredSignatures,
			dailyLimitBI,
			[], // emergencyContacts handled in chain.ts via Relayer
			salt
		);

		await deployWalletOnChain(
			owners,
			requiredSignatures,
			dailyLimitBI,
			[], // emergencyContacts handled in chain.ts via Relayer
			salt
		);

		const wallet = await prisma.wallet.create({
			data: {
				userId,
				address: computedAddress,
				name,
				emergencyEmail,
				dailyLimit,
			},
		});

		await prisma.user.update({
			where: { id: userId },
			data: { onboarded: true },
		});

		await prisma.notification.create({
			data: {
				userId,
				title: "Wallet Created",
				message: `Success! Your wallet "${name}" has been created.`,
				type: "DEPOSIT_SUCCESS",
			},
		});

		return {
			message: "Wallet created successfully",
			walletId: wallet.id,
			address: wallet.address,
		};
	} catch (error: any) {
		console.error("Wallet creation error:", error);
		return {
			error: "Internal server error",
			message: "System error",
		};
	}
}

/**
 * Deposit funds to a wallet
 */
export async function deposit(input: DepositInput): Promise<WalletResponse> {
	try {
		const validatedData = depositSchema.safeParse(input);

		if (!validatedData.success) {
			return {
				error: validatedData.error.issues[0].message,
				message: "Validation failed",
			};
		}

		const { walletId, amount, category } = validatedData.data;

		const wallet = await prisma.wallet.findUnique({
			where: { id: walletId },
			include: { user: true },
		});

		if (!wallet) {
			return {
				error: "Wallet not found",
				message: "Deposit failed",
			};
		}

		await prisma.transaction.create({
			data: {
				walletId,
				type: "DEPOSIT",
				amount: amount,
				category,
				description: `Deposit to wallet ${wallet.name}`,
			},
		});

		await prisma.notification.create({
			data: {
				userId: wallet.userId,
				title: "Deposit Successful",
				message: `You have successfully deposited USD ${amount} to your wallet.`,
				type: "DEPOSIT_SUCCESS",
			},
		});

		return {
			message: "Deposit successful",
			walletId: wallet.id,
		};
	} catch (error: any) {
		console.error("Deposit error:", error);
		return {
			error: "Internal server error",
			message: "System error",
		};
	}
}

/**
 * Withdraw funds from a wallet
 */
export async function withdraw(input: WithdrawInput): Promise<WalletResponse> {
	try {
		const validatedData = withdrawSchema.safeParse(input);

		if (!validatedData.success) {
			return {
				error: validatedData.error.issues[0].message,
				message: "Validation failed",
			};
		}

		const { walletId, amount, category, description } = validatedData.data;

		const wallet = await prisma.wallet.findUnique({
			where: { id: walletId },
			include: {
				transactions: true,
				user: true,
			},
		});

		if (!wallet) {
			return {
				error: "Wallet not found",
				message: "Withdrawal failed",
			};
		}

		type TransactionType = (typeof wallet.transactions)[number];

		const totalDeposits = wallet.transactions
			.filter((t: TransactionType) => t.type === "DEPOSIT" || t.type === "YIELD")
			.reduce((sum: number, t: TransactionType) => sum + Number(t.amount), 0);
		const totalWithdrawals = wallet.transactions
			.filter((t: TransactionType) => t.type === "WITHDRAWAL")
			.reduce((sum: number, t: TransactionType) => sum + Number(t.amount), 0);
		const balance = totalDeposits - totalWithdrawals;

		if (amount > balance) {
			return {
				error: "Insufficient balance",
				message: "Withdrawal failed",
			};
		}

		const spendingLimit = Number(wallet.dailyLimit);
		const alreadySpentToday = Number(wallet.spendingToday);
		const newSpendingToday = alreadySpentToday + amount;

		if (spendingLimit > 0 && newSpendingToday > spendingLimit) {
			return {
				error:
					"Daily limit exceeded.",
				message: "Withdrawal failed, Daily limit exceeded. Please request approval from emergency contact.",
			};
		}

		if (
			spendingLimit > 0 &&
			newSpendingToday >= spendingLimit * 0.8 &&
			alreadySpentToday < spendingLimit * 0.8
		) {
			await prisma.notification.create({
				data: {
					userId: wallet.userId,
					title: "Daily Limit Alert",
					message: `Warning: You have reached 80% of your daily spending limit.`,
					type: "DAILY_LIMIT_ALERT",
				},
			});
		}

		await prisma.transaction.create({
			data: {
				walletId,
				type: "WITHDRAWAL",
				amount,
				category,
				description,
			},
		});

		await prisma.wallet.update({
			where: { id: walletId },
			data: { spendingToday: newSpendingToday },
		});

		await prisma.notification.create({
			data: {
				userId: wallet.userId,
				title: "Withdrawal Successful",
				message: `You have successfully withdrawn USD ${amount} to your bank account.`,
				type: "WITHDRAWAL_SUCCESS",
			},
		});

		return {
			message: "Withdrawal successful",
			walletId: wallet.id,
		};
	} catch (error: any) {
		console.error("Withdrawal error:", error);
		return {
			error: "Internal server error",
			message: "System error",
		};
	}
}

/**
 * Approve daily limit override with emergency contact code
 */
export async function approveDailyLimit(
	input: ApproveDailyLimitInput,
): Promise<WalletResponse> {
	try {
		const validatedData = approvalSchema.safeParse(input);

		if (!validatedData.success) {
			return {
				error: validatedData.error.issues[0].message,
				message: "Validation failed",
			};
		}

		const { walletId, approvalCode } = validatedData.data;

		const wallet = await prisma.wallet.findUnique({
			where: { id: walletId },
		});

		if (!wallet) {
			return {
				error: "Wallet not found",
				message: "Approval failed",
			};
		}

		if (!wallet.approvalTokenHash || !wallet.approvalExpiresAt) {
			return {
				error: "No pending approval request",
				message: "Approval failed",
			};
		}

		if (wallet.approvalExpiresAt < new Date()) {
			return {
				error: "Approval request expired",
				message: "Approval failed",
			};
		}

		// Verify token
		const tokenHash = crypto.createHash("sha256").update(approvalCode).digest("hex");
		if (tokenHash !== wallet.approvalTokenHash) {
			return {
				error: "Invalid approval code",
				message: "Approval failed",
			};
		}

		// Execute on-chain unlock via Relayer
		await resetDailyLimitOnChain(wallet.address);

		// Reset local tracking and clear approval fields
		await prisma.wallet.update({
			where: { id: walletId },
			data: {
				spendingToday: 0,
				approvalTokenHash: null,
				approvalExpiresAt: null
			},
		});

		await prisma.notification.create({
			data: {
				userId: wallet.userId,
				title: "Daily Limit Override Approved",
				message:
					"Your emergency contact has approved your daily limit override. Your limit has been reset for today.",
				type: "EMERGENCY_APPROVAL",
			},
		});

		return {
			message: "Daily limit override approved",
			walletId: wallet.id,
		};
	} catch (error: any) {
		console.error("Approval error:", error);
		return {
			error: "Internal server error",
			message: "System error",
		};
	}
}

/**
 * Request unlocking of daily limit
 */
export async function requestDailyLimitUnlock(walletId: string): Promise<{ success: boolean; message: string }> {
	try {
		const wallet = await prisma.wallet.findUnique({
			where: { id: walletId },
		});

		if (!wallet) return { success: false, message: "Wallet not found" };

		if (!wallet.emergencyEmail || wallet.emergencyEmail.length === 0) {
			return { success: false, message: "No emergency contacts configured" };
		}

		// Generate secure token
		const approvalToken = crypto.randomBytes(32).toString("hex");
		const tokenHash = crypto.createHash("sha256").update(approvalToken).digest("hex");
		const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

		// Save hash to DB
		await prisma.wallet.update({
			where: { id: walletId },
			data: {
				approvalTokenHash: tokenHash,
				approvalExpiresAt: expiresAt,
			},
		});

		const approvalLink = `${process.env.NEXT_PUBLIC_APP_URL}/approve/${walletId}?code=${approvalToken}`;

		for (const email of wallet.emergencyEmail) {
			await sendApprovalEmail(email, wallet.name, approvalLink);
		}

		return { success: true, message: "Approval request sent to emergency contacts" };
	} catch (error) {
		console.error("Request unlock error:", error);
		return { success: false, message: "Failed to send request" };
	}
}

/**
 * Process a reward/yield for a wallet
 */
export async function processReward(
	input: ProcessRewardInput,
): Promise<WalletResponse> {
	try {
		const validatedData = rewardSchema.safeParse(input);

		if (!validatedData.success) {
			return {
				error: validatedData.error.issues[0].message,
				message: "Validation failed",
			};
		}

		const { walletId, amount } = validatedData.data;

		const wallet = await prisma.wallet.findUnique({
			where: { id: walletId },
		});

		if (!wallet) {
			return {
				error: "Wallet not found",
				message: "Reward processing failed",
			};
		}

		await prisma.transaction.create({
			data: {
				walletId,
				type: "YIELD",
				amount,
				category: "REWARD",
				description: "Weekly staking reward",
			},
		});

		await prisma.notification.create({
			data: {
				userId: wallet.userId,
				title: "Reward Received!",
				message: `Your wallet just received a weekly yield of USD ${amount}.`,
				type: "REWARD_RECEIVED",
			},
		});

		return {
			message: "Reward processed successfully",
			walletId: wallet.id,
		};
	} catch (error: any) {
		console.error("Reward error:", error);
		return {
			error: "Internal server error",
			message: "System error",
		};
	}
}

// ============================================
// Profile Management
// ============================================

// Profile schemas
const getProfileSchema = z.object({
	walletId: z.string().min(1, "Wallet ID is required"),
});

const updateProfileSchema = z.object({
	walletId: z.string().min(1, "Wallet ID is required"),
	nickname: z.string().min(1).optional(),
	dailyLimit: z.number().nonnegative().optional(),
	emergencyEmail: z.union([
		z.string().email(),
		z.array(z.string().email())
	]).optional().nullable().transform(val => {
		if (val === null) return []; // Handle null as empty array
		if (val === undefined) return undefined;
		return Array.isArray(val) ? val : [val];
	}),
});

// Profile input types
export type GetProfileInput = z.infer<typeof getProfileSchema>;
export type UpdateProfileInput = z.input<typeof updateProfileSchema>;

// Profile response type
export type ProfileResponse = {
	email: string;
	nickname: string;
	dailyLimit: number;
	emergencyEmail: string[];
	walletAddress: string;
	error?: string;
	message?: string;
};

// Update profile response type
export type UpdateProfileResponse = {
	success: boolean;
	error?: string;
	message?: string;
};

/**
 * Get profile data for a wallet
 */
export async function getProfile(
	input: GetProfileInput,
): Promise<ProfileResponse> {
	try {
		const validatedData = getProfileSchema.safeParse(input);

		if (!validatedData.success) {
			return {
				error: validatedData.error.issues[0].message,
				email: "",
				nickname: "",
				dailyLimit: 0,
				emergencyEmail: [],
				walletAddress: "",
			};
		}

		const { walletId } = validatedData.data;

		const wallet = await prisma.wallet.findUnique({
			where: { id: walletId },
			include: { user: true },
		});

		if (!wallet) {
			return {
				error: "Wallet not found",
				email: "",
				nickname: "",
				dailyLimit: 0,
				emergencyEmail: [],
				walletAddress: "",
			};
		}

		return {
			email: wallet.user.email || "",
			nickname: wallet.name,
			dailyLimit: Number(wallet.dailyLimit),
			emergencyEmail: wallet.emergencyEmail,
			walletAddress: wallet.address,
		};
	} catch (error: any) {
		console.error("Get profile error:", error);
		return {
			error: "Internal server error",
			email: "",
			nickname: "",
			dailyLimit: 0,
			emergencyEmail: [],
			walletAddress: "",
		};
	}
}

/**
 * Update profile data for a wallet
 */
export async function updateProfile(
	input: UpdateProfileInput,
): Promise<UpdateProfileResponse> {
	try {
		const validatedData = updateProfileSchema.safeParse(input);

		if (!validatedData.success) {
			return {
				success: false,
				error: validatedData.error.issues[0].message,
				message: "Validation failed",
			};
		}

		const { walletId, nickname, dailyLimit, emergencyEmail } =
			validatedData.data;

		const wallet = await prisma.wallet.findUnique({
			where: { id: walletId },
		});

		if (!wallet) {
			return {
				success: false,
				error: "Wallet not found",
				message: "Update failed",
			};
		}

		// Build update data object with only provided fields
		const updateData: {
			name?: string;
			dailyLimit?: number;
			emergencyEmail?: string[];
		} = {};

		if (nickname !== undefined) {
			updateData.name = nickname;
		}
		if (dailyLimit !== undefined) {
			updateData.dailyLimit = dailyLimit;
		}
		if (emergencyEmail !== undefined) {
			updateData.emergencyEmail = emergencyEmail;
		}

		await prisma.wallet.update({
			where: { id: walletId },
			data: updateData,
		});

		return {
			success: true,
			message: "Profile updated successfully",
		};
	} catch (error: any) {
		console.error("Update profile error:", error);
		return {
			success: false,
			error: "Internal server error",
			message: "System error",
		};
	}
}

/**
 * Get yield history for a wallet
 */
export async function getRewardsHistory(walletId: string): Promise<any[]> {
	try {
		const history = await prisma.yieldHistory.findMany({
			where: { walletId },
			orderBy: { timestamp: "desc" },
		});
		return history.map(h => ({
			id: h.id,
			walletId: h.walletId,
			amount: Number(h.amount),
			timestamp: h.timestamp,
		}));
	} catch (error) {
		console.error("Get rewards history error:", error);
		return [];
	}
}

/**
 * Initiate an external transfer (recorded as a withdrawal)
 */
export async function initiateTransfer(input: {
	walletId: string;
	destinationAddress: string;
	amount: number;
	category: string;
	description?: string;
}): Promise<WalletResponse> {
	try {
		const { walletId, destinationAddress, amount, category, description } = input;

		const wallet = await prisma.wallet.findUnique({
			where: { id: walletId },
		});

		if (!wallet) {
			return { error: "Wallet not found", message: "Transfer failed" };
		}

		// Calculate balance (simplified for this action)
		const transactions = await prisma.transaction.findMany({ where: { walletId } });
		const totalDeposits = transactions
			.filter(t => t.type === "DEPOSIT" || t.type === "YIELD")
			.reduce((sum, t) => sum + Number(t.amount), 0);
		const totalWithdrawals = transactions
			.filter(t => t.type === "WITHDRAWAL")
			.reduce((sum, t) => sum + Number(t.amount), 0);
		const balance = totalDeposits - totalWithdrawals;

		if (amount > balance) {
			return { error: "Insufficient balance", message: "Transfer failed" };
		}

		// Record the transaction as a WITHDRAWAL for now to reflect balance change
		await prisma.transaction.create({
			data: {
				walletId,
				type: "WITHDRAWAL",
				amount,
				category: category || "Transfer",
				description: description || `Transfer to ${destinationAddress}`,
			},
		});

		// Create notification
		await prisma.notification.create({
			data: {
				userId: wallet.userId,
				title: "Transfer Sent",
				message: `You successfully sent ${amount} unit(s) to ${destinationAddress}.`,
				type: "WITHDRAWAL_SUCCESS",
			},
		});

		return {
			message: "Transfer successful",
			walletId: wallet.id,
		};
	} catch (error) {
		console.error("Initiate transfer error:", error);
		return { error: "Internal server error", message: "System error" };
	}
}

/**
 * Get the current user's primary wallet
 */
export async function getCurrentWallet(): Promise<{ id: string; address: string; name: string; dailyLimit: number; spendingToday: number } | null> {
	try {
		const userId = await getCurrentUserId();
		if (!userId) return null;

		const wallet = await prisma.wallet.findFirst({
			where: { userId },
			orderBy: { createdAt: "asc" },
		});

		if (!wallet) return null;

		return {
			id: wallet.id,
			address: wallet.address,
			name: wallet.name,
			dailyLimit: Number(wallet.dailyLimit),
			spendingToday: Number(wallet.spendingToday),
		};
	} catch (error) {
		console.error("Get current wallet error:", error);
		return null;
	}
}
