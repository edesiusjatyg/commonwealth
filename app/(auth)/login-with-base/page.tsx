"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, User, Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function LoginWithBasePage() {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [isPending, setIsPending] = useState(false);
	const searchParams = useSearchParams();

	// Show warning toast if user is already authenticated
	useEffect(() => {
		if (searchParams.get("toast") === "already-authenticated") {
			toast.warning("Already Logged In", {
				description: "You are already authenticated. Redirected to home.",
			});
		}
	}, [searchParams]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		// TODO: Integrate with Base authentication
		setIsPending(true);
		// Placeholder - will be integrated later
		setTimeout(() => setIsPending(false), 1000);
	};

	return (
		<main className="relative flex min-h-screen flex-col items-center bg-gradient-to-b from-white via-white to-pink-50/50 px-6 py-12 overflow-hidden">
			{/* Decorative purple circle - bottom right */}
			{/* <div className="absolute -right-32 -bottom-32 h-80 w-80 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600" /> */}

			{/* Content container */}
			<div className="relative z-10 flex w-full max-w-sm flex-col items-center pt-16">
				{/* Base Logo */}
				<div className="mb-6 h-14 w-14 rounded-lg bg-indigo-600" />

				{/* Title */}
				<h1 className="mb-10 text-center text-xl font-bold text-foreground">
					Login With Base
				</h1>

				{/* Form */}
				<form onSubmit={handleSubmit} className="w-full space-y-4">
					{/* Username field with icon */}
					<div className="relative">
						<User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
						<Input
							type="text"
							placeholder="Username"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							disabled={isPending}
							className="h-12 rounded-full border-gray-200 bg-white pl-12 shadow-sm"
						/>
					</div>

					{/* Password field with icon */}
					<div className="relative">
						<Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
						<Input
							type={showPassword ? "text" : "password"}
							placeholder="Password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
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

					{/* Login button */}
					<Button
						type="submit"
						className="mt-8 h-12 w-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-500 text-white font-semibold shadow-lg hover:from-violet-700 hover:to-indigo-600"
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
				</form>

				{/* Already have account link */}
				<div className="mt-auto pt-20 text-center text-sm">
					<span className="text-muted-foreground">
						Already have an Account?{" "}
					</span>
					<Link
						href="/login"
						className="font-semibold text-foreground hover:underline"
					>
						click here
					</Link>
				</div>
			</div>
		</main>
	);
}
