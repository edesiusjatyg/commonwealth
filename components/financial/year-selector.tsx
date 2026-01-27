import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface YearSelectorProps {
	setYear: (year: number) => void;
	yearValue: number;
	currentYear: number;
   className?: string;
}

export function YearSelector({
	setYear,
	yearValue,
	currentYear,
}: YearSelectorProps) {
	return (
		<div className={cn("flex items-center gap-2")}>
			<Button
				variant="ghost"
				size="icon"
				className="h-8 w-8"
				onClick={() => setYear(yearValue - 1)}
			>
				<ChevronLeft className="h-4 w-4" />
			</Button>

			<span className="min-w-[4rem] text-center font-medium text-sm">
				{yearValue}
			</span>

			<Button
				variant="ghost"
				size="icon"
				className="h-8 w-8"
				onClick={() => setYear(yearValue + 1)}
				disabled={yearValue >= currentYear}
			>
				<ChevronRight className="h-4 w-4" />
			</Button>
		</div>
	);
}
