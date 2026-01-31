"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useLoginForm } from "@/hooks/use-login-form";
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
import { Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
   // TODO: integrate remember me into useLoginForm
	const [showPassword, setShowPassword] = useState(false);
	const [rememberMe, setRememberMe] = useState(false);
	const { form, isPending, loginAction } = useLoginForm();
	const searchParams = useSearchParams();

	// Show warning toast if user is already authenticated
	useEffect(() => {
		if (searchParams.get("toast") === "already-authenticated") {
			toast.warning("Already Logged In", {
				description: "You are already authenticated. Redirected to home.",
			});
		}
	}, [searchParams]);

	return (
		<main className="relative flex min-h-screen flex-col items-center bg-gradient-to-b from-white via-white to-pink-50/50 px-6 py-12 overflow-hidden">
			{/* Decorative purple circle - top left */}
			<div className="absolute -left-20 -top-20 h-56 w-56 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600" />

			{/* Content container */}
			<div className="relative z-10 flex w-full max-w-sm flex-col items-center pt-24">
				{/* Title */}
				<h1 className="mb-10 text-center text-2xl font-bold bg-gradient-to-r from-violet-600 to-indigo-500 bg-clip-text text-transparent">
					Please login to your account
				</h1>

				{/* Form */}
				<Form {...form}>
					<form onSubmit={loginAction} className="w-full space-y-4">
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
												placeholder="Email"
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
								</FormItem>
							)}
						/>

						{/* Remember me & Forgot password row */}
						{/* <div className="flex items-center justify-between px-1">
							<div className="flex items-center gap-2">
								<Checkbox
									id="remember"
									checked={rememberMe}
									onCheckedChange={(checked) => setRememberMe(checked === true)}
								/>
								<label
									htmlFor="remember"
									className="text-sm text-muted-foreground cursor-pointer"
								>
									Remember me
								</label>
							</div>
							<Link
								href="/forgot-password"
								className="text-sm font-medium text-violet-600 hover:underline"
							>
								Forgot Password?
							</Link>
						</div> */}

						{/* Error message */}
						{form.formState.errors.root && (
							<div className="text-sm text-destructive text-center">
								{form.formState.errors.root.message}
							</div>
						)}

						{/* Login button */}
						<Button
							type="submit"
							className="mt-6 h-12 w-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-500 text-white font-semibold shadow-lg hover:from-violet-700 hover:to-indigo-600"
							disabled={isPending}
						>
							{isPending ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Signing in...
								</>
							) : (
								"Log In"
							)}
						</Button>

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

				{/* Sign up link */}
				<div className="mt-auto pt-16 text-center text-sm">
					<span className="text-muted-foreground">
						Don&apos;t have an Account?{" "}
					</span>
					<Link
						href="/register"
						className="font-semibold text-foreground hover:underline"
					>
						Sign Up
					</Link>
				</div>
			</div>
		</main>
	);
}
