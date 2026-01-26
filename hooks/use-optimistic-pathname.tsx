import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export const useOptimisticPathname = () => {
	const pathname = usePathname();
	const [optimisticPath, setOptimisticPath] = useState(pathname);

	// Reconcile when real route changes
	useEffect(() => {
		setOptimisticPath(pathname);
	}, [pathname]);

	return {
		pathname: optimisticPath,
		setOptimisticPath,
	};
};
