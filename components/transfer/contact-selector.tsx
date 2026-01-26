"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useTransferredAccounts } from "@/hooks/use-transferred-accounts";
import { Contact2, Search, Users } from "lucide-react";

type ContactSelectorProps = {
	onSelect: (address: string, name?: string) => void;
	disabled?: boolean;
};

export function ContactSelector({ onSelect, disabled }: ContactSelectorProps) {
	const [open, setOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const { data: contacts, isLoading } = useTransferredAccounts();

	const filteredContacts = useMemo(() => {
		if (!contacts || !searchQuery) return contacts || [];

		const query = searchQuery.toLowerCase();
		return contacts.filter(
			(contact) =>
				contact.name.toLowerCase().includes(query) ||
				contact.walletAddress.toLowerCase().includes(query),
		);
	}, [contacts, searchQuery]);

	const handleSelect = (address: string, name?: string) => {
		onSelect(address, name);
		setOpen(false);
		setSearchQuery(""); 
	};

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetTrigger asChild>
				<Button
					type="button"
					variant="outline"
					size="sm"
					disabled={disabled}
					className="shrink-0"
				>
					<Contact2 className="mr-2 size-4" />
					Contacts
				</Button>
			</SheetTrigger>
			<SheetContent side="bottom" className="container h-[80vh]">
				<SheetHeader>
					<SheetTitle>Select Contact</SheetTitle>
				</SheetHeader>
				<div className="mt-4 space-y-4">
					{/* Search Input */}
					<div className="relative">
						<Search className="absolute top-3 left-3 size-4 text-muted-foreground" />
						<Input
							placeholder="Search contacts..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-9"
						/>
					</div>

					{/* Contact List */}
					<ScrollArea className="h-[calc(80vh-140px)]">
						{isLoading ? (
							<div className="space-y-3">
								{[1, 2, 3, 4].map((i) => (
									<div key={i} className="flex items-center gap-3 p-3">
										<Skeleton className="size-10 rounded-full" />
										<div className="flex-1 space-y-2">
											<Skeleton className="h-4 w-32" />
											<Skeleton className="h-3 w-48" />
										</div>
									</div>
								))}
							</div>
						) : filteredContacts.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-12">
								<Users className="mb-4 size-12 text-muted-foreground" />
								<p className="text-muted-foreground text-sm">
									{searchQuery ? "No contacts found" : "No saved contacts yet"}
								</p>
								<p className="mt-1 text-muted-foreground text-xs">
									{searchQuery
										? "Try a different search term"
										: "Transfer to a wallet to save it as a contact"}
								</p>
							</div>
						) : (
							<div className="space-y-2">
								{filteredContacts.map((contact) => (
									<button
										key={contact.walletAddress}
										type="button"
										onClick={() =>
											handleSelect(contact.walletAddress, contact.name)
										}
										className="flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-muted"
									>
										<Avatar className="size-10">
											<AvatarFallback className="bg-primary/10 font-semibold text-primary">
												{contact.name.charAt(0).toUpperCase()}
											</AvatarFallback>
										</Avatar>
										<div className="flex-1 overflow-hidden">
											<p className="font-medium text-sm">{contact.name}</p>
											<p className="truncate font-mono text-muted-foreground text-xs">
												{contact.shortenedWalletAddress}
											</p>
										</div>
									</button>
								))}
							</div>
						)}
					</ScrollArea>
				</div>
			</SheetContent>
		</Sheet>
	);
}
