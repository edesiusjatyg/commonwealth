"use client";

import { Button } from "@/components/ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { truncateText } from "@/lib/utils";
import { getWalletInsight } from "@/rpc";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-user";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

// Actual user ID from Neon database - in production, get from auth context
const USER_ID = "cmkwpj2x800006uijtemzrsra";

export function WalletInsightContent() {
	const { data: user } = useUser();
	const [isExpanded, setIsExpanded] = useState(false);

	const { data, isLoading, error } = useQuery({
		queryKey: ["walletInsight", user?.id],
		queryFn: async () => {
			if (!user?.id) return null;
			const result = await getWalletInsight(user.id);
			return result.insight;
		},
		enabled: !!user?.id,
	});

	if (isLoading) {
		return <p className="text-muted-foreground text-sm">Loading insight...</p>;
	}

	if (error) {
		return (
			<p className="text-destructive text-sm">
				Failed to load insight. Please try again.
			</p>
		);
	}

	if (!data) {
		return null;
	}

	const isLongText = data.length > 120;
	const shortText = truncateText(data, 120);

	const Content = () => {
		if (isLongText) {
			return (
				<>
					{!isExpanded && <p className="mt-2 text-sm">{shortText}</p>}
					<CollapsibleContent>
						<p className="mt-2 text-sm">{data}</p>
					</CollapsibleContent>
				</>
			);
		}
		return <p className="text-sm">{shortText}</p>;
	};

	return (
		<Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
			<div className="space-y-2">
				<Content />

				{isLongText && (
					<CollapsibleTrigger asChild>
						<Button
							variant="ghost"
							size="sm"
							className="h-8 px-2 font-normal text-muted-foreground text-xs hover:text-foreground"
						>
							{isExpanded ? (
								<>
									<ChevronUp className="mr-1 size-3" />
									Show less
								</>
							) : (
								<>
									<ChevronDown className="mr-1 size-3" />
									Read more
								</>
							)}
						</Button>
					</CollapsibleTrigger>
				)}
			</div>
		</Collapsible>
	);
}
