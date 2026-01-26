import { useEffect, useMemo, useRef, useState } from "react";
import { useDebounce } from "./use-debounce";

export const useScrollDirection = ({
	debounce = true,
}: {
	debounce?: number | boolean;
} = {}) => {
	debounce = debounce === false ? 0 : 100;
	const scrollRef = useRef(0);
	const [scrollDir, setScrollDir] = useState("up");
	const debouncedDir = useDebounce(scrollDir, debounce);

	const onScroll = useMemo(
		() => () => {
			if (window.scrollY > scrollRef.current) {
				setScrollDir("down");
				scrollRef.current = window.scrollY;
				return;
			}
			setScrollDir("up");
			scrollRef.current = window.scrollY;
		},
		[],
	);

	useEffect(() => {
		window.addEventListener("scroll", onScroll);
		return () => window.removeEventListener("scroll", onScroll);
	});

	return {
		scrollDirection: debouncedDir,
	};
};
