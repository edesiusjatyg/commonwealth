"use server";

import { delayedValue } from "@/lib/utils";

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
    name: "Charlie White",
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

const mockInsight =
	"Portfolio summary: your wallet holds 3 main assets with a combined estimated value of ~$12,450. Performance: the portfolio is down 4.1% Portfolio summary: your wallet holds 3 main assets with a combined estimated value of ~$12,450. Performance: the portfolio is down 4.1%";
// const mockInsight = "idafda";

export const getWalletInsight = async (): Promise<WalletInsightDTO> => {
	return await delayedValue(
		{
			insight: mockInsight,
		},
		1000,
	);
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
