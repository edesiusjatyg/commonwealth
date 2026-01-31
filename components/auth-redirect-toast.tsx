"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

export function AuthRedirectToast() {
	const searchParams = useSearchParams();

	useEffect(() => {
		if (searchParams.get("toast") === "already-authenticated") {
			toast.warning("Already Logged In", {
				description: "You are already authenticated.",
			});
		}
	}, [searchParams]);

	return null;
}
