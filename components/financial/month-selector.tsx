import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MONTH_NAMES } from "@/hooks/use-transaction-history";
import { cn } from "@/lib/utils";

interface MonthSelectorProps {
	monthName: string;
	onSelect: (month: string) => void;
	className?: string;
}

export function MonthSelector({
	monthName,
	onSelect,
	className,
}: MonthSelectorProps) {
	return (
		<Tabs
			value={monthName}
			onValueChange={onSelect}
			className={cn("pb-4", className)}
		>
			<div className="relative bg-background !w-full">
				<div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-3 bg-gradient-to-r from-background to-transparent" />
				<div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-3 bg-gradient-to-l from-background to-transparent" />
            <div className="w-[100vw] z-[9] bg-background"></div>
				<TabsList
					className="w-full justify-start overflow-x-auto scroll-smooth bg-transparent [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
					style={{ scrollSnapType: "x mandatory" }}
				>
					{MONTH_NAMES.map((month) => (
						<TabsTrigger
							key={month}
							value={month}
							className={cn(
								"shrink-0 scroll-ml-3 border-transparent border-b-2 py-1.5 text-sm transition-color transition-duration-150 transition-transform ease-in data-[state=active]:shadow-none",
								// monthName === month && "border-primary text-primary",
								monthName === month && "scale-110 font-bold text-primary",
							)}
							style={{ scrollSnapAlign: "start" }}
						>
							{month}
						</TabsTrigger>
					))}
				</TabsList>
			</div>
		</Tabs>
	);
}
