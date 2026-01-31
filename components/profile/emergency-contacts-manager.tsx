"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mail, Plus, Trash2, AlertCircle } from "lucide-react";
import { useEmergencyContacts, useAddEmergencyContact, useRemoveEmergencyContact } from "@/hooks/use-emergency-contacts";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface EmergencyContactsManagerProps {
	walletId: string;
}

export function EmergencyContactsManager({ walletId }: EmergencyContactsManagerProps) {
	const [newEmail, setNewEmail] = useState("");
	const [newName, setNewName] = useState("");

	const { data: contacts = [], isLoading } = useEmergencyContacts(walletId);
	const addContact = useAddEmergencyContact(walletId);
	const removeContact = useRemoveEmergencyContact(walletId);

	const canRemove = contacts.length > 2; // Must maintain at least 2 contacts
	const canAdd = contacts.length < 2; // Maximum 2 contacts

	const handleAdd = () => {
		if (!newEmail) return;

		addContact.mutate(
			{
				email: newEmail,
				name: newName || undefined,
			},
			{
				onSuccess: () => {
					setNewEmail("");
					setNewName("");
				},
			}
		);
	};

	const handleRemove = (contactId: string) => {
		if (!canRemove) {
			return; // Prevent removing if at minimum
		}
		if (confirm("Are you sure you want to remove this emergency contact?")) {
			removeContact.mutate(contactId);
		}
	};

	if (isLoading) {
		return (
			<Card>
				<CardContent className="flex items-center justify-center py-8">
					<Loader2 className="h-6 w-6 animate-spin" />
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Mail className="h-5 w-5" />
						<CardTitle>Emergency Contacts</CardTitle>
					</div>
					<Badge variant={contacts.length === 2 ? "default" : "destructive"}>
						{contacts.length}/2 Required
					</Badge>
				</div>
				<CardDescription>
					Emergency contacts approve expenses when you exceed your daily limit. Exactly 2 contacts are required.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Existing Contacts */}
				{contacts.length > 0 ? (
					<div className="space-y-2">
						{contacts.map((contact) => (
							<div
								key={contact.id}
								className="flex items-center justify-between rounded-lg border p-3"
							>
								<div className="flex-1">
									<p className="font-medium">{contact.email}</p>
									{contact.name && (
										<p className="text-sm text-muted-foreground">{contact.name}</p>
									)}
								</div>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => handleRemove(contact.id)}
									disabled={removeContact.isPending || !canRemove}
									title={!canRemove ? "Minimum 2 contacts required" : "Remove contact"}
								>
									<Trash2 className="h-4 w-4 text-destructive" />
								</Button>
							</div>
						))}
					</div>
				) : (
					<Alert variant="destructive">
						<AlertCircle className="h-4 w-4" />
						<AlertDescription>
							No emergency contacts found. You must have exactly 2 emergency contacts to use your wallet.
						</AlertDescription>
					</Alert>
				)}

				{/* Warning if not at required count */}
				{contacts.length > 0 && contacts.length !== 2 && (
					<Alert variant="destructive">
						<AlertCircle className="h-4 w-4" />
						<AlertDescription>
							You currently have {contacts.length} contact{contacts.length !== 1 ? 's' : ''}. 
							{contacts.length < 2 ? ` Please add ${2 - contacts.length} more.` : ` Please remove ${contacts.length - 2}.`}
						</AlertDescription>
					</Alert>
				)}

				{/* Add New Contact */}
				{canAdd && (
					<div className="space-y-3 rounded-lg border border-dashed p-4">
						<div className="flex items-center justify-between">
							<Label className="text-sm font-medium">Add New Contact</Label>
							<Badge variant="secondary">{contacts.length}/2</Badge>
						</div>

						<div className="space-y-2">
							<Input
								type="email"
								placeholder="Emergency email"
								value={newEmail}
								onChange={(e) => setNewEmail(e.target.value)}
								disabled={addContact.isPending}
							/>
							<Input
								type="text"
								placeholder="Name (optional)"
								value={newName}
								onChange={(e) => setNewName(e.target.value)}
								disabled={addContact.isPending}
							/>
							<Button
								onClick={handleAdd}
								disabled={!newEmail || addContact.isPending}
								className="w-full"
							>
								{addContact.isPending ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Adding...
									</>
								) : (
									<>
										<Plus className="mr-2 h-4 w-4" />
										Add Contact
									</>
								)}
							</Button>
						</div>

						<p className="text-xs text-muted-foreground">
							This contact will receive notifications when you need approval for over-limit transactions.
						</p>
					</div>
				)}

				{!canAdd && contacts.length >= 2 && (
					<p className="text-sm text-muted-foreground text-center">
						Maximum of 2 emergency contacts reached.
					</p>
				)}

				{contacts.length >= 5 && (
					<Alert>
						<AlertDescription>
							Maximum of 5 emergency contacts reached. Remove a contact to add a new one.
						</AlertDescription>
					</Alert>
				)}
			</CardContent>
		</Card>
	);
}
