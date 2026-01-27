"use client";

import { useState } from "react";
import Link from "next/link";
import { useRegisterForm, passwordRequirements } from "@/hooks/use-register-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2, Eye, EyeOff, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const {
		form,
		isPending,
		registerAction,
		password,
		passwordsMatch,
		allRequirementsMet,
	} = useRegisterForm();

	return (
		<main className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<CardTitle className="text-2xl font-bold">Create Account</CardTitle>
					<CardDescription>
						Sign up to get started with your wallet
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Form {...form}>
						<form onSubmit={registerAction} className="space-y-4">
							<FormField
								control={form.control}
								name="email"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Email</FormLabel>
										<FormControl>
											<Input
												type="email"
												placeholder="you@example.com"
												{...field}
												disabled={isPending}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="password"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Password</FormLabel>
										<FormControl>
											<div className="relative">
												<Input
													type={showPassword ? "text" : "password"}
													placeholder="••••••••"
													{...field}
													disabled={isPending}
													className="pr-10"
												/>
												<Button
													type="button"
													variant="ghost"
													size="icon"
													className="absolute right-0 top-0 h-full px-3"
													onClick={() => setShowPassword(!showPassword)}
												>
													{showPassword ? (
														<EyeOff className="h-4 w-4" />
													) : (
														<Eye className="h-4 w-4" />
													)}
												</Button>
											</div>
										</FormControl>
										<FormMessage />

										{/* Password strength indicator */}
										{password.length > 0 && (
											<div className="mt-2 space-y-1">
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

							<FormField
								control={form.control}
								name="confirmPassword"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Confirm Password</FormLabel>
										<FormControl>
											<div className="relative">
												<Input
													type={showConfirmPassword ? "text" : "password"}
													placeholder="••••••••"
													{...field}
													disabled={isPending}
													className="pr-10"
												/>
												<Button
													type="button"
													variant="ghost"
													size="icon"
													className="absolute right-0 top-0 h-full px-3"
													onClick={() => setShowConfirmPassword(!showConfirmPassword)}
												>
													{showConfirmPassword ? (
														<EyeOff className="h-4 w-4" />
													) : (
														<Eye className="h-4 w-4" />
													)}
												</Button>
											</div>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							{form.formState.errors.root && (
								<div className="text-sm text-destructive">
									{form.formState.errors.root.message}
								</div>
							)}

							<Button
								type="submit"
								className="w-full"
								disabled={isPending || !passwordsMatch || !allRequirementsMet}
							>
								{isPending ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Creating account...
									</>
								) : (
									"Create Account"
								)}
							</Button>
						</form>
					</Form>

					<div className="mt-6 text-center text-sm">
						<span className="text-muted-foreground">
							Already have an account?{" "}
						</span>
						<Link
							href="/login"
							className="font-medium text-primary hover:underline"
						>
							Sign in
						</Link>
					</div>
				</CardContent>
			</Card>
		</main>
	);
}
