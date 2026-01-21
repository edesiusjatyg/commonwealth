"use client";
import { useQuery } from "@tanstack/react-query";

export const getUser = async () => {
	await new Promise((r) => setTimeout(r, 1000));
	return { username: "Faris" } as unknown as { username: string } | undefined;
};

export const useUser = () => {
	"use client";
	const userQuery = useQuery({
		queryKey: ["user"],
		queryFn: async () => getUser(),
	});

	return userQuery;
};
