"use server";

import { prisma } from "@/lib/prisma";
import { WalletResponse } from "@/types";
import { getCurrentUserId } from "@/lib/session";
import { z } from "zod";
import {
	computeWalletAddress,
	deployWalletOnChain,
	resetDailyLimitOnChain,
} from "./chain";
import { sendApprovalEmail } from "./email";
import { Address } from "viem";
import crypto from "crypto";

// Input schemas
const createWalletSchema = z.object({
	userId: z.string(),
	name: z.string().min(1, "Wallet name is required"),
	emergencyEmail: z
		.union([z.string().email(), z.array(z.string().email())])
		.optional()
		.transform((val) => {
			if (!val) return [];
			return Array.isArray(val) ? val : [val];
		})
		.refine((val) => val.length >= 1 && val.length <= 2, {
			message: "At least one and max 2 emergency contacts required",
		}),
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
	console.info("[wallet.createWallet] Wallet creation started", { 
		userId: input.userId,
		walletName: input.name 
	});
	
	try {
		const validatedData = createWalletSchema.safeParse(input);

		if (!validatedData.success) {
			console.warn("[wallet.createWallet] Validation failed", { 
				error: validatedData.error.issues[0].message 
			});
			return {
				error: validatedData.error.issues[0].message,
				message: "Validation failed",
			};
		}

		const { userId, name, emergencyEmail, dailyLimit } =
			validatedData.data;

		console.info("[wallet.createWallet] Fetching user EOA", { userId });
		const user = await prisma.user.findUnique({
			where: { id: userId },
		});

		if (!user || !user.eoaAddress) {
			console.error("[wallet.createWallet] User EOA not found", { userId });
			return {
				error: "User EOA not found",
				message: "Wallet creation failed",
			};
		}

		// Prepare Contract Args
		const owners: Address[] = [user.eoaAddress as Address];
		const requiredSignatures = BigInt(1); // 1/1 for this MVP
		const dailyLimitBI = BigInt(Math.floor(dailyLimit * 1e18));

		const salt = BigInt(Math.floor(Math.random() * 1000000));

		console.info("[wallet.createWallet] Computing wallet address", { 
			owners, 
			dailyLimit: dailyLimitBI.toString() 
		});
		const computedAddress = await computeWalletAddress(
			owners,
			requiredSignatures,
			dailyLimitBI,
			[],
			salt,
		);

		console.info("[wallet.createWallet] Deploying wallet on-chain", { 
			address: computedAddress 
		});
		await deployWalletOnChain(
			owners,
			requiredSignatures,
			dailyLimitBI,
			[],
			salt,
		);

		// Create wallet
		console.info("[wallet.createWallet] Creating wallet in database", { 
			address: computedAddress, 
			name 
		});
		const wallet = await prisma.wallet.create({
			data: {
				userId,
				address: computedAddress,
				name,
				emergencyEmail: emergencyEmail || [],
				dailyLimit,
			},
		});
		
		console.info("[wallet.createWallet] Marking user as onboarded", { userId });
		await prisma.user.update({
			where: { id: userId },
			data: { onboarded: true },
		});

		console.info("[wallet.createWallet] Creating notification", { userId });
		await prisma.notification.create({
			data: {
				userId,
				title: "Wallet Created",
				message: `Success! Your wallet "${name}" has been created.`,
				type: "DEPOSIT_SUCCESS",
			},
		});

		console.info("[wallet.createWallet] Wallet created successfully", { 
			walletId: wallet.id, 
			address: wallet.address 
		});
		return {
			message: "Wallet created successfully",
			walletId: wallet.id,
			address: wallet.address,
		};
	} catch (error: unknown) {
		console.error("[wallet.createWallet] Wallet creation error:", error);
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
	console.info("[wallet.deposit] Deposit started", { 
		walletId: input.walletId, 
		amount: input.amount 
	});
	
	try {
		const validatedData = depositSchema.safeParse(input);

		if (!validatedData.success) {
			console.warn("[wallet.deposit] Validation failed", { 
				error: validatedData.error.issues[0].message 
			});
			return {
				error: validatedData.error.issues[0].message,
				message: "Validation failed",
			};
		}

		const { walletId, amount, category } = validatedData.data;

		console.info("[wallet.deposit] Fetching wallet", { walletId });
		const wallet = await prisma.wallet.findUnique({
			where: { id: walletId },
			include: { user: true },
		});

		if (!wallet) {
			console.error("[wallet.deposit] Wallet not found", { walletId });
			return {
				error: "Wallet not found",
				message: "Deposit failed",
			};
		}

		console.info("[wallet.deposit] Creating transaction", { walletId, amount, category });
		await prisma.transaction.create({
			data: {
				walletId,
				type: "DEPOSIT",
				amount: amount,
				category,
				description: `Deposit to wallet ${wallet.name}`,
			},
		});

		console.info("[wallet.deposit] Creating notification", { userId: wallet.userId });
		await prisma.notification.create({
			data: {
				userId: wallet.userId,
				title: "Deposit Successful",
				message: `You have successfully deposited USD ${amount} to your wallet.`,
				type: "DEPOSIT_SUCCESS",
			},
		});

		console.info("[wallet.deposit] Deposit successful", { walletId, amount });
		return {
			message: "Deposit successful",
			walletId: wallet.id,
		};
	} catch (error: unknown) {
		console.error("[wallet.deposit] Deposit error:", error);
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
	console.info("[wallet.withdraw] Withdrawal started", { 
		walletId: input.walletId, 
		amount: input.amount 
	});
	
	try {
		const validatedData = withdrawSchema.safeParse(input);

		if (!validatedData.success) {
			console.warn("[wallet.withdraw] Validation failed", { 
				error: validatedData.error.issues[0].message 
			});
			return {
				error: validatedData.error.issues[0].message,
				message: "Validation failed",
			};
		}

		const { walletId, amount, category, description } = validatedData.data;

		console.info("[wallet.withdraw] Fetching wallet", { walletId });
		const wallet = await prisma.wallet.findUnique({
			where: { id: walletId },
			include: {
				transactions: true,
				user: true,
			},
		});

		if (!wallet) {
			console.error("[wallet.withdraw] Wallet not found", { walletId });
			return {
				error: "Wallet not found",
				message: "Withdrawal failed",
			};
		}

		type TransactionType = (typeof wallet.transactions)[number];

		const totalDeposits = wallet.transactions
			.filter(
				(t: TransactionType) => t.type === "DEPOSIT" || t.type === "YIELD",
			)
			.reduce((sum: number, t: TransactionType) => sum + Number(t.amount), 0);
		const totalWithdrawals = wallet.transactions
			.filter((t: TransactionType) => t.type === "WITHDRAWAL")
			.reduce((sum: number, t: TransactionType) => sum + Number(t.amount), 0);
		const balance = totalDeposits - totalWithdrawals;

		console.info("[wallet.withdraw] Balance check", { balance, requestedAmount: amount });
		if (amount > balance) {
			console.warn("[wallet.withdraw] Insufficient balance", { balance, requestedAmount: amount });
			return {
				error: "Insufficient balance",
				message: "Withdrawal failed",
			};
		}

		const spendingLimit = Number(wallet.dailyLimit);
		const alreadySpentToday = Number(wallet.spendingToday);
		const newSpendingToday = alreadySpentToday + amount;

		console.info("[wallet.withdraw] Daily limit check", { 
			spendingLimit, 
			alreadySpentToday, 
			newSpendingToday 
		});
		if (spendingLimit > 0 && newSpendingToday > spendingLimit) {
			console.warn("[wallet.withdraw] Daily limit exceeded", { 
				spendingLimit, 
				newSpendingToday 
			});
			return {
				error: "Daily limit exceeded.",
				message:
					"Withdrawal failed, Daily limit exceeded. Please request approval from emergency contact.",
			};
		}

		if (
			spendingLimit > 0 &&
			newSpendingToday >= spendingLimit * 0.8 &&
			alreadySpentToday < spendingLimit * 0.8
		) {
			console.info("[wallet.withdraw] Sending 80% limit warning notification", { 
				userId: wallet.userId 
			});
			await prisma.notification.create({
				data: {
					userId: wallet.userId,
					title: "Daily Limit Alert",
					message: `Warning: You have reached 80% of your daily spending limit.`,
					type: "DAILY_LIMIT_ALERT",
				},
			});
		}

		console.info("[wallet.withdraw] Creating withdrawal transaction", { walletId, amount });
		await prisma.transaction.create({
			data: {
				walletId,
				type: "WITHDRAWAL",
				amount,
				category,
				description,
			},
		});

		console.info("[wallet.withdraw] Updating spending today", { 
			walletId, 
			newSpendingToday 
		});
		await prisma.wallet.update({
			where: { id: walletId },
			data: { spendingToday: newSpendingToday },
		});

		console.info("[wallet.withdraw] Creating success notification", { 
			userId: wallet.userId 
		});
		await prisma.notification.create({
			data: {
				userId: wallet.userId,
				title: "Withdrawal Successful",
				message: `You have successfully withdrawn USD ${amount} to your bank account.`,
				type: "WITHDRAWAL_SUCCESS",
			},
		});

		console.info("[wallet.withdraw] Withdrawal successful", { walletId, amount });
		return {
			message: "Withdrawal successful",
			walletId: wallet.id,
		};
	} catch (error: unknown) {
		console.error("[wallet.withdraw] Withdrawal error:", error);
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
	console.info("[wallet.approveDailyLimit] Approval attempt started", { 
		walletId: input.walletId 
	});
	
	try {
		const validatedData = approvalSchema.safeParse(input);

		if (!validatedData.success) {
			console.warn("[wallet.approveDailyLimit] Validation failed", { 
				error: validatedData.error.issues[0].message 
			});
			return {
				error: validatedData.error.issues[0].message,
				message: "Validation failed",
			};
		}

		const { walletId, approvalCode } = validatedData.data;

		console.info("[wallet.approveDailyLimit] Fetching wallet", { walletId });
		const wallet = await prisma.wallet.findUnique({
			where: { id: walletId },
		});

		if (!wallet) {
			console.error("[wallet.approveDailyLimit] Wallet not found", { walletId });
			return {
				error: "Wallet not found",
				message: "Approval failed",
			};
		}

		if (!wallet.approvalTokenHash || !wallet.approvalExpiresAt) {
			console.warn("[wallet.approveDailyLimit] No pending approval request", { walletId });
			return {
				error: "No pending approval request",
				message: "Approval failed",
			};
		}

		if (wallet.approvalExpiresAt < new Date()) {
			console.warn("[wallet.approveDailyLimit] Approval request expired", { 
				walletId, 
				expiresAt: wallet.approvalExpiresAt 
			});
			return {
				error: "Approval request expired",
				message: "Approval failed",
			};
		}

		// Verify token
		console.info("[wallet.approveDailyLimit] Verifying approval code");
		const tokenHash = crypto
			.createHash("sha256")
			.update(approvalCode)
			.digest("hex");
		if (tokenHash !== wallet.approvalTokenHash) {
			console.warn("[wallet.approveDailyLimit] Invalid approval code", { walletId });
			return {
				error: "Invalid approval code",
				message: "Approval failed",
			};
		}

		// Execute on-chain unlock via Relayer
		console.info("[wallet.approveDailyLimit] Resetting daily limit on-chain", { 
			address: wallet.address 
		});
		await resetDailyLimitOnChain(wallet.address);

		// Reset local tracking and clear approval fields
		console.info("[wallet.approveDailyLimit] Updating wallet state", { walletId });
		await prisma.wallet.update({
			where: { id: walletId },
			data: {
				spendingToday: 0,
				approvalTokenHash: null,
				approvalExpiresAt: null,
			},
		});

		console.info("[wallet.approveDailyLimit] Creating success notification", { 
			userId: wallet.userId 
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

		console.info("[wallet.approveDailyLimit] Approval successful", { walletId });
		return {
			message: "Daily limit override approved",
			walletId: wallet.id,
		};
	} catch (error: unknown) {
		console.error("[wallet.approveDailyLimit] Approval error:", error);
		return {
			error: "Internal server error",
			message: "System error",
		};
	}
}

/**
 * Request unlocking of daily limit
 */
export async function requestDailyLimitUnlock(
	walletId: string,
): Promise<{ success: boolean; message: string }> {
	console.info("[wallet.requestDailyLimitUnlock] Unlock request started", { walletId });
	
	try {
		const wallet = await prisma.wallet.findUnique({
			where: { id: walletId },
		});

		if (!wallet) {
			console.error("[wallet.requestDailyLimitUnlock] Wallet not found", { walletId });
			return { success: false, message: "Wallet not found" };
		}

		if (!wallet.emergencyEmail || wallet.emergencyEmail.length === 0) {
			console.warn("[wallet.requestDailyLimitUnlock] No emergency contacts configured", { 
				walletId 
			});
			return { success: false, message: "No emergency contacts configured" };
		}

		// Generate secure token
		console.info("[wallet.requestDailyLimitUnlock] Generating approval token");
		const approvalToken = crypto.randomBytes(32).toString("hex");
		const tokenHash = crypto
			.createHash("sha256")
			.update(approvalToken)
			.digest("hex");
		const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

		// Save hash to DB
		console.info("[wallet.requestDailyLimitUnlock] Saving approval token to database", { 
			walletId 
		});
		await prisma.wallet.update({
			where: { id: walletId },
			data: {
				approvalTokenHash: tokenHash,
				approvalExpiresAt: expiresAt,
			},
		});

		const approvalLink = `${process.env.NEXT_PUBLIC_APP_URL}/api/approve?walletId=${walletId}&code=${approvalToken}`;

		console.info("[wallet.requestDailyLimitUnlock] Sending approval emails", { 
			recipientCount: wallet.emergencyEmail.length 
		});
		for (const email of wallet.emergencyEmail) {
			await sendApprovalEmail(email, wallet.name, approvalLink);
		}

		console.info("[wallet.requestDailyLimitUnlock] Unlock request successful", { walletId });
		return {
			success: true,
			message: "Approval request sent to emergency contacts",
		};
	} catch (error) {
		console.error("[wallet.requestDailyLimitUnlock] Request unlock error:", error);
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
	emergencyEmail: z
		.union([z.string().email(), z.array(z.string().email())])
		.optional()
		.nullable()
		.transform((val) => {
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
			include: {
				user: true,
			},
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
			emergencyEmail: wallet.emergencyEmail || [],
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
		return history.map((h) => ({
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
		const { walletId, destinationAddress, amount, category, description } =
			input;

		const wallet = await prisma.wallet.findUnique({
			where: { id: walletId },
		});

		if (!wallet) {
			return { error: "Wallet not found", message: "Transfer failed" };
		}

		// Calculate balance (simplified for this action)
		const transactions = await prisma.transaction.findMany({
			where: { walletId },
		});
		const totalDeposits = transactions
			.filter((t) => t.type === "DEPOSIT" || t.type === "YIELD")
			.reduce((sum, t) => sum + Number(t.amount), 0);
		const totalWithdrawals = transactions
			.filter((t) => t.type === "WITHDRAWAL")
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
export async function getCurrentWallet(): Promise<{
	id: string;
	address: string;
	name: string;
	dailyLimit: number;
	spendingToday: number;
} | null> {
	try {
		const userId = await getCurrentUserId();
		if (!userId) return null;

      console.debug("Fetching wallet for userId:", userId);

		const wallet = await prisma.wallet.findFirst({
			where: { userId },
			orderBy: { createdAt: "asc" },
		});

		if (!wallet) return null;

      console.debug(
							`Found wallet for user id ${userId}: ${wallet.address}`,
						);

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

// ============================================
// Emergency Contact Management (Simplified - Array-based)
// ============================================
// Emergency contacts are now stored as a simple string array in Wallet.emergencyEmail
// Managed through updateProfile() function - no separate table needed
