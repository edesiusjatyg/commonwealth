function withValidProperties(
	properties: Record<string, undefined | string | string[]>,
) {
	return Object.fromEntries(
		Object.entries(properties).filter(([_, value]) =>
			Array.isArray(value) ? value.length > 0 : !!value,
		),
	);
}

// TODO: add account association (need base.dev acc)
export async function GET() {
	const URL = process.env.NEXT_PUBLIC_URL as string;
	return Response.json({
		accountAssociation: {
			// these will be added in step 5
			header: "",
			payload: "",
			signature: "",
		},
		miniapp: {
			version: "1",
			name: "Example Mini App",
			homeUrl: "https://ex.co",
			iconUrl: "https://ex.co/i.png",
			splashImageUrl: "https://ex.co/l.png",
			splashBackgroundColor: "#000000",
			webhookUrl: "https://ex.co/api/webhook",
			subtitle: "Fast, fun, social",
			description: "A fast, fun way to challenge friends in real time.",
			screenshotUrls: [
				"https://ex.co/s1.png",
				"https://ex.co/s2.png",
				"https://ex.co/s3.png",
			],
			primaryCategory: "social",
			tags: ["example", "miniapp", "baseapp"],
			heroImageUrl: "https://ex.co/og.png",
			tagline: "Play instantly",
			ogTitle: "Example Mini App",
			ogDescription: "Challenge friends in real time.",
			ogImageUrl: "https://ex.co/og.png",
			noindex: true,
		},
	}); // see the next step for the manifest_json_object
}
