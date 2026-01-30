import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";

export default function OnboardingPage() {
	return (
		<div>
			<h1>Onboarding</h1>
         <p>Onboarding belum selesai, langsung lanjut aja</p>
			<Link href="/init-wallet" className={buttonVariants()}>Set up your wallet</Link>
		</div>
	);
}