"use client";

import { useState } from "react";
import Link from "next/link";
import { useRegisterForm, passwordRequirements } from "@/hooks/use-register-form";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, User, Mail, Lock, Eye, EyeOff, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
	const [showPassword, setShowPassword] = useState(false);
	const [agreedToTerms, setAgreedToTerms] = useState(false);
	const {
		form,
		isPending,
		registerAction,
		password,
		allRequirementsMet,
	} = useRegisterForm();

	return (
		<main className="relative flex min-h-screen flex-col items-center bg-gradient-to-b from-indigo-50/50 via-white to-pink-50/50 px-6 py-12 overflow-hidden">
			{/* Decorative purple circle - right side */}
			{/* <div className="absolute -right-48 top-1/3 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-violet-600 to-indigo-400" /> */}

			{/* Content container */}
			<div className="relative z-10 flex w-full max-w-sm flex-col items-center pt-8">
				{/* Title */}
				<h1 className="mb-16 text-center text-3xl font-bold bg-gradient-to-r from-violet-600 to-indigo-500 bg-clip-text text-transparent">
					Create Account
				</h1>

				{/* Form */}
				<Form {...form}>
					<form onSubmit={registerAction} className="w-full space-y-4">
						{/* Username field with icon */}
						<div className="relative">
							<User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
							<Input
								type="text"
								placeholder="Username"
								disabled={isPending}
								className="h-12 rounded-full border-gray-200 bg-white pl-12 shadow-sm"
							/>
						</div>

						{/* Email field with icon */}
						<FormField
							control={form.control}
							name="email"
							render={({ field }) => (
								<FormItem>
									<FormControl>
										<div className="relative">
											<Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
											<Input
												type="email"
												placeholder="email"
												{...field}
												disabled={isPending}
												className="h-12 rounded-full border-gray-200 bg-white pl-12 shadow-sm"
											/>
										</div>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Password field with icon */}
						<FormField
							control={form.control}
							name="password"
							render={({ field }) => (
								<FormItem>
									<FormControl>
										<div className="relative">
											<Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
											<Input
												type={showPassword ? "text" : "password"}
												placeholder="Password"
												{...field}
												disabled={isPending}
												className="h-12 rounded-full border-gray-200 bg-white pl-12 pr-12 shadow-sm"
											/>
											<Button
												type="button"
												variant="ghost"
												size="icon"
												className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
												onClick={() => setShowPassword(!showPassword)}
											>
												{showPassword ? (
													<Eye className="h-4 w-4 text-muted-foreground" />
												) : (
													<EyeOff className="h-4 w-4 text-muted-foreground" />
												)}
											</Button>
										</div>
									</FormControl>
									<FormMessage />

									{/* Password strength indicator */}
									{password.length > 0 && (
										<div className="mt-2 space-y-1 px-2">
											{passwordRequirements.map((req) => {
												const met = req.test(password);
												return (
													<div
														key={req.label}
														className={cn(
															"flex items-center gap-2 text-xs",
															met ? "text-green-600" : "text-muted-foreground"
														)}
													>
														{met ? (
															<Check className="h-3 w-3" />
														) : (
															<X className="h-3 w-3" />
														)}
														{req.label}
													</div>
												);
											})}
										</div>
									)}
								</FormItem>
							)}
						/>

						{/* Terms & Conditions checkbox */}
						{/* <div className="flex items-start gap-3 px-1 py-2">
							<Checkbox
								id="terms"
								checked={agreedToTerms}
								onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
								className="mt-0.5"
							/>
							<label
								htmlFor="terms"
								className="text-sm text-muted-foreground leading-tight cursor-pointer"
							>
								Dengan mendaftar, Anda menyetujui{" "}
								<Link href="/terms" className="font-semibold text-violet-600 hover:underline">
									Syarat & Ketentuan
								</Link>{" "}
								dan{" "}
								<Link href="/privacy" className="font-semibold text-violet-600 hover:underline">
									Kebijakan Privasi
								</Link>{" "}
								kami
							</label>
						</div> */}

						{/* Error message - fixed height to prevent layout shift */}
						<div className="min-h-[20px] text-sm text-destructive text-center">
							{form.formState.errors.root?.message}
						</div>

						{/* Register button */}
						<Button
							type="submit"
							className="mt-6 h-12 w-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-500 text-white font-semibold shadow-lg hover:from-violet-700 hover:to-indigo-600"
							// className="mt-4 h-12 w-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-500 text-white font-semibold shadow-lg hover:from-violet-700 hover:to-indigo-600 bg-opacity-100"
							disabled={isPending || !agreedToTerms || !allRequirementsMet}
						>
							{isPending ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Creating account...
								</>
							) : (
								"Daftar"
							)}
						</Button>

						{/* Or divider */}
						<div className="relative flex items-center py-2">
							<div className="flex-grow border-t border-gray-200" />
							<span className="mx-4 text-sm text-muted-foreground">Or</span>
							<div className="flex-grow border-t border-gray-200" />
						</div>

						{/* Continue with Base button */}
						<Link href="/login-with-base" className="w-full">
							<Button
								type="button"
								variant="outline"
								className="h-12 w-full rounded-full border-gray-200 bg-white font-semibold shadow-sm hover:bg-gray-50"
								disabled={isPending}
							>
								<div className="mr-2 h-5 w-5 rounded bg-indigo-600" />
								Continue With Base
							</Button>
						</Link>
					</form>
				</Form>

				{/* Sign in link */}
				<div className="mt-auto pt-12 text-center text-sm">
					<span className="text-muted-foreground">
						Already have an account?{" "}
					</span>
					<Link
						href="/login"
						className="font-semibold text-background hover:underline"
					>
						Sign in
					</Link>
				</div>
			</div>
		</main>
	);
}
