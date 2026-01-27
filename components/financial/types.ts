import type { LucideIcon } from "lucide-react";

export interface BudgetDataItem {
	name: string;
	value: number;
	color: string;
	fill: string;
}

export interface CategoryConfig {
	icon: LucideIcon;
	color: string;
}

export type CategoryConfigMap = Record<string, CategoryConfig>;
