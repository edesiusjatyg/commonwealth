import { delayedValue } from "@/lib/utils";
import { bankAccountSchema, Result } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

const supportedBanks = [
	"BCA (Bank Central Asia)",
	"BNI (Bank Negara Indonesia)",
	"BRI (Bank Rakyat Indonesia)",
	"Mandiri",
	"CIMB Niaga",
	"Permata Bank",
	"Danamon",
] as const;

const withdrawFormSchema = z.object({
	bank: z.enum(supportedBanks, "Bank is not supported"),
	accountNumber: bankAccountSchema,
	amount: z.number().min(10, "Minimum withdraw amount is 10 USDT"),
	password: z.string().min(8, "Password must be at least 8 characters long"),
});

export type WithdrawFormData = z.infer<typeof withdrawFormSchema>;
type WithdrawError = {
	code: "INSUFFICIENT_FUNDS" | "INVALID_ACCOUNT" | "SERVER_ERROR";
	message: string;
};

type WithdrawResult = Result<number, WithdrawError>;
type WithdrawFn = (data: WithdrawFormData) => Promise<WithdrawResult>;
const withdraw: WithdrawFn = async (_) => {
	return delayedValue(
		{
			success: false,
			error: { code: "INSUFFICIENT_FUNDS", message: "Insufficient funds" },
		},
		1000,
	);
};

export const useWithdrawForm = () => {
	const [isPending, startTransition] = useTransition();

	const form = useForm<WithdrawFormData>({
		defaultValues: {
			bank: supportedBanks[0],
			accountNumber: "",
			amount: 10,
			password: "",
		},
		resolver: zodResolver(withdrawFormSchema),
	});

	const handleError = (error: WithdrawError) => {
		switch (error.code) {
			case "INSUFFICIENT_FUNDS":
				toast.error("Insufficient funds", {
					description: "Please check your balance and try again.",
				});
				form.setError("amount", { message: error.message });
				break;
			case "INVALID_ACCOUNT":
				form.setError("accountNumber", { message: error.message });
				break;
			case "SERVER_ERROR":
				form.setError("root", { message: error.message });
				toast.error(error.message);
				break;
		}
	};

	const withdrawAction = (e: React.FormEvent) => {
		e.preventDefault();
		startTransition(() => {
			form.handleSubmit(async (data) => {
				const res = await withdraw(data);
				if (res.success) {
					// handle success (e.g., show a success message, redirect, etc.)
					return;
				} else {
					handleError(res.error);
				}
			})();
		});
	};

	return {
		form,
		isPending,
		withdrawAction,
	};
};
