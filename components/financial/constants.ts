import { ArrowDownLeft, HelpCircle, TrendingUp, Wallet } from "lucide-react";
import type { BudgetDataItem, CategoryConfigMap } from "./types";

// Mock data for budget breakdown
export const budgetData: BudgetDataItem[] = [
	{ name: "Balance", value: 30, color: "#db5793", fill: "#db5793" },
	{ name: "Shopping", value: 20, color: "#ef4444", fill: "#ef4444" },
	{ name: "Dining & Food", value: 15, color: "#f97316", fill: "#f97316" },
	{ name: "Travel", value: 25, color: "#22c55e", fill: "#22c55e" },
	{ name: "Others", value: 10, color: "#8b5cf6", fill: "#8b5cf6" },
];

export const chartConfig = {
	balance: { label: "Balance", color: "#db5793" },
	shopping: { label: "Shopping", color: "#ef4444" },
	dining: { label: "Dining & Food", color: "#f97316" },
	travel: { label: "Travel", color: "#22c55e" },
	others: { label: "Others", color: "#8b5cf6" },
};

// Category icon and color mapping
export const categoryConfig: CategoryConfigMap = {
	Salary: { icon: ArrowDownLeft, color: "bg-green-500" },
	Food: { icon: Wallet, color: "bg-orange-500" },
	Transportation: { icon: Wallet, color: "bg-amber-500" },
	Interest: { icon: TrendingUp, color: "bg-purple-500" },
	Entertainment: { icon: Wallet, color: "bg-pink-500" },
	Transfer: { icon: ArrowDownLeft, color: "bg-blue-500" },
	Shopping: { icon: Wallet, color: "bg-red-500" },
	Others: { icon: HelpCircle, color: "bg-gray-500" },
};

export const defaultCategoryConfig = {
	icon: HelpCircle,
	color: "bg-gray-500",
};

// Color mapping for charts (Tailwind class to hex)
export const categoryColorMap: Record<string, string> = {
	Salary: "#22c55e", // green-500
	Food: "#f97316", // orange-500
	Transportation: "#f59e0b", // amber-500
	Interest: "#a855f7", // purple-500
	Entertainment: "#ec4899", // pink-500
	Transfer: "#3b82f6", // blue-500
	Shopping: "#ef4444", // red-500
	Others: "#6b7280", // gray-500
};

export const defaultCategoryColor = "#6b7280"; // gray-500

export const DEFAULT_TOTAL_BUDGET = 1800;
