import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function delayedValue<T>(value: T, delay: number = 1000): Promise<T> {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve(value);
		}, delay);
	});
}

export function delayedValueCallback<T>(
	value: T,
	delay: number,
): () => Promise<T> {
	return () =>
		new Promise((resolve) => {
			setTimeout(() => {
				resolve(value);
			}, delay);
		});
}

export const formatBalance = (
	balance: number,
	options?: {
		withoutCurrencySymbol?: boolean;
	},
) => {
	return balance.toLocaleString("en-US", {
		style: options?.withoutCurrencySymbol ? "decimal" : "currency",
		currency: "USD",
	});
};

export const truncateText = (text: string, maxLength: number) => {
	if (text.length <= maxLength) {
		return text;
	}
	return `${text.slice(0, maxLength)}...`;
};
