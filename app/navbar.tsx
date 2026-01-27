"use client";

import { Home, type LucideIcon, PieChart, User, Wallet } from "lucide-react";
import Link, { type LinkProps } from "next/link";
import { useRef } from "react";
import { useHideOnScroll } from "@/hooks/use-hide-on-scroll";
import { useOptimisticPathname } from "@/hooks/use-optimistic-pathname";
import { cn } from "@/lib/utils";

type NavItemProp = {
	label: string;
	icon: LucideIcon;
	path: string;
};

const NavItem = ({
	data,
	isActive,
	...rest
}: {
	data: NavItemProp;
	isActive: boolean;
} & Omit<LinkProps, "href">) => {
	const Icon = data.icon;

	return (
		<Link
			{...rest}
			href={data.path}
			className={cn(
				"flex w-full flex-col items-center justify-center gap-2 rounded-md px-4 py-2 transition",
				isActive ? "text-primary" : "text-muted-foreground hover:bg-muted",
			)}
		>
			<Icon className={isActive ? "h-3 w-3" : "h-4 w-4"} />
			{isActive && <span className="text-xs">{data.label}</span>}
		</Link>
	);
};

const navItems: Readonly<NavItemProp[]> = [
	{ label: "Home", icon: Home, path: "/home" },
	{ label: "Wallet", icon: Wallet, path: "/wallet" },
	{ label: "Analysis", icon: PieChart, path: "/analysis" },
	{ label: "Profile", icon: User, path: "/profile" },
];

export default function Navbar() {
	const { pathname, setOptimisticPath } = useOptimisticPathname();
	const navRef = useRef<HTMLElement>(null);

	useHideOnScroll(navRef);

	return (
		<nav
			ref={navRef}
			className={cn(
				"fixed bottom-0 z-10 flex w-full gap-2 rounded-tl-sm rounded-tr-sm bg-muted px-2 py-4",
				"translate-y-0 transition-transform duration-300",
			)}
		>
			{navItems.map((item) => {
				const isActive =
					pathname === item.path ||
					(item.path !== "/" && pathname.startsWith(`${item.path}/`));
				return (
					<NavItem
						key={item.label}
						data={item}
						isActive={isActive}
						onClick={() => setOptimisticPath(item.path)}
					/>
				);
			})}
		</nav>
	);
}
