import { useState, useEffect } from "react";

export function useDebounce<T>(value: T, delay: number) {
	const [debouncedValue, setDebouncedValue] = useState(value);

	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedValue(value);
		}, delay);

		return () => clearTimeout(handler); // Bersihkan timeout jika value berubah
	}, [value, delay]);

	return debouncedValue;
}
