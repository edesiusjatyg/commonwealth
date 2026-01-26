// Server Actions - Re-exports
// All server actions are exported from this file for clean imports

// Auth actions
export { login, logout, register } from "./auth";
export type { LoginInput, RegisterInput } from "./auth";

// Wallet actions
export {
	createWallet,
	deposit,
	withdraw,
	approveDailyLimit,
	processReward,
} from "./wallet";
export type {
	CreateWalletInput,
	DepositInput,
	WithdrawInput,
	ApproveDailyLimitInput,
	ProcessRewardInput,
} from "./wallet";

// Expenses actions
export { getExpenses } from "./expenses";
export type { GetExpensesInput } from "./expenses";

// Notifications actions
export { getNotifications, markNotificationRead } from "./notifications";
export type {
	GetNotificationsInput,
	MarkNotificationReadInput,
	MarkNotificationReadResponse,
} from "./notifications";

// AI actions
export { chat, generateInsight, getInsight, getSentiment } from "./ai";
export type {
	ChatInput,
	GenerateInsightInput,
	GetInsightInput,
	GetSentimentInput,
} from "./ai";

// Onboarding actions
export { getOnboardingSteps } from "./onboarding";
