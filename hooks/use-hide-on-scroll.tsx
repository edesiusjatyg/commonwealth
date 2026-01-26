import { useEffect, useRef } from "react";

export function useHideOnScroll(
	ref: React.RefObject<HTMLElement | null>,
	{
		hideClass = "translate-y-[100%]",
		showClass = "translate-y-0",
	}: {
		hideClass?: string;
		showClass?: string;
	} = {},
) {
	const lastScrollY = useRef(0);
	const dirRef = useRef<"up" | "down">("up");

	useEffect(() => {
		let el: HTMLElement | null = null;

		const onScroll = () => {
			if (!el) return;

			const currentY = window.scrollY;
			const nextDir = currentY > lastScrollY.current ? "down" : "up";

			if (nextDir !== dirRef.current) {
				el.classList.toggle(hideClass, nextDir === "down");
				el.classList.toggle(showClass, nextDir === "up");
				dirRef.current = nextDir;
			}

			lastScrollY.current = currentY;
		};

		const tryAttach = () => {
			if (!ref.current) return false;
			el = ref.current;

			// Ensure initial state is correct
			el.classList.add(showClass);
			el.classList.remove(hideClass);

			window.addEventListener("scroll", onScroll, { passive: true });
			return true;
		};

		// Try immediately
		if (!tryAttach()) {
			// Retry on next frame if ref isn't ready yet
			const raf = requestAnimationFrame(() => tryAttach());
			return () => cancelAnimationFrame(raf);
		}

		return () => {
			window.removeEventListener("scroll", onScroll);
		};
	}, [ref, hideClass, showClass]);
}
