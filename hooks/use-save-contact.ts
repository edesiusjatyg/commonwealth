"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { saveContact } from "@/rpc";

export const useSaveContact = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: saveContact,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["transfer-history"] });
		},
	});
};
