import { Bell, BellDot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TopBarUserContainer } from "./top-bar-user";

/* TopBar component
contains:
1. Greeting for user (username)
2. Notification icon
*/
export function TopBar({ className }: { className?: string }) {
	const hasNotifications = true;

	return (
		<div
			className={cn(
				"container mb-4 flex w-full items-center justify-between py-4",
				className,
			)}
		>
			<TopBarUserContainer />
			<Button variant={"ghost"} size={"icon-lg"}>
				{hasNotifications ? <BellDot /> : <Bell />}
			</Button>
		</div>
	);
}
