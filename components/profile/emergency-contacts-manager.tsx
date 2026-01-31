"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mail, Plus, Trash2, AlertCircle } from "lucide-react";
import { useProfile, useUpdateProfile } from "@/hooks/use-profile";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

export function EmergencyContactsManager() {
	const [newEmail, setNewEmail] = useState("");
	const { data: profile, isLoading } = useProfile();
	const updateProfile = useUpdateProfile();

	const contacts = profile?.emergencyEmail || [];
	const canRemove = contacts.length > 1; // Must maintain at least 1 contact
	const canAdd = contacts.length < 2; // Maximum 2 contacts

	const handleAdd = () => {
		if (!newEmail) return;
		
		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(newEmail)) {
			toast.error("Invalid email address");
			return;
		}

		// Check for duplicates
		if (contacts.includes(newEmail)) {
			toast.error("This email is already an emergency contact");
			return;
		}

		// Add new email to array
		updateProfile.mutate(
			{
				emergencyEmail: [...contacts, newEmail],
			},
			{
				onSuccess: () => {
					setNewEmail("");
					toast.success("Emergency contact added");
				},
				onError: () => {
					toast.error("Failed to add contact");
				},
			}
		);
	};

	const handleRemove = (email: string) => {
		if (!canRemove) {
			toast.error("Minimum 1 emergency contact required");
			return;
		}
		
		if (confirm("Are you sure you want to remove this emergency contact?")) {
			// Remove email from array
			updateProfile.mutate(
				{
					emergencyEmail: contacts.filter((e) => e !== email),
				},
				{
					onSuccess: () => {
						toast.success("Emergency contact removed");
					},
					onError: () => {
						toast.error("Failed to remove contact");
					},
				}
			);
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
					<Badge variant={contacts.length >= 1 && contacts.length <= 2 ? "default" : "destructive"}>
						{contacts.length}/2
					</Badge>
				</div>
				<CardDescription>
					Emergency contacts approve expenses when you exceed your daily limit. 1-2 contacts recommended.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Existing Contacts */}
				{contacts.length > 0 ? (
					<div className="space-y-2">
						{contacts.map((email) => (
							<div
								key={email}
								className="flex items-center justify-between rounded-lg border p-3"
							>
								<div className="flex-1">
									<p className="font-medium">{email}</p>
								</div>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => handleRemove(email)}
									disabled={updateProfile.isPending || !canRemove}
									title={!canRemove ? "Minimum 1 contact required" : "Remove contact"}
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
							No emergency contacts found. Please add at least 1 emergency contact.
						</AlertDescription>
					</Alert>
				)}

				{/* Warning if not at required count */}
				{contacts.length === 0 && (
					<Alert variant="destructive">
						<AlertCircle className="h-4 w-4" />
						<AlertDescription>
							You currently have no emergency contacts. Please add at least 1.
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
								placeholder="Emergency email address"
								value={newEmail}
								onChange={(e) => setNewEmail(e.target.value)}
								disabled={updateProfile.isPending}
								onKeyDown={(e) => e.key === "Enter" && handleAdd()}
							/>
							<Button
								onClick={handleAdd}
								disabled={!newEmail || updateProfile.isPending}
								className="w-full"
							>
								{updateProfile.isPending ? (
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
			</CardContent>
		</Card>
	);
}
