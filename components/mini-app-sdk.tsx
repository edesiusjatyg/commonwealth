import sdk from "@farcaster/miniapp-sdk";
import { useEffect } from "react";

export function MiniAppSdk() {
	useEffect(() => {
		sdk.actions.ready();
	}, []);

	return <></>;
}
