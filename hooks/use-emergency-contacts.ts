"use client";

/**
 * DEPRECATED: Emergency contact management is now simplified to array-based approach
 * Emergency contacts are managed through use-profile.ts and updateProfile()
 * 
 * This file is kept for backward compatibility but should not be used in new code.
 * Use emergencyEmail array field in profile instead.
 */

// Re-export emergency contact types for backward compatibility (if needed)
export type EmergencyContact = {
	email: string;
};

// Stub functions - do not use
export function useEmergencyContacts() {
	return { data: [], isLoading: false, error: null };
}

export function useAddEmergencyContact() {
	return {
		mutate: () => console.warn("useAddEmergencyContact is deprecated"),
		isPending: false,
	};
}

export function useRemoveEmergencyContact() {
	return {
		mutate: () => console.warn("useRemoveEmergencyContact is deprecated"),
		isPending: false,
	};
}
