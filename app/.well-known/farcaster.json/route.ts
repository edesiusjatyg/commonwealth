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
      name: "CommonWealth",
      homeUrl: URL,
      iconUrl: URL + "/logo.png",
      splashImageUrl: URL + "/logo.png",
      splashBackgroundColor: "#dededeff",
      // webhookUrl: "https://ex.co/api/webhook",

      subtitle: "Human-first crypto wallets",
      description:
         "A human-first smart wallet that brings safety controls, financial awareness, and decision support to on-chain money. Set spending limits, use social approvals, track expenses, and make informed crypto decisions without giving up control.",

      screenshotUrls: [
         "https://www.polytec.com.au/colour/bone-white/" // TEMPORARY
         // "https://ex.co/s1.png", // Spending limits & approvals
         // "https://ex.co/s2.png", // Expense tracking & categorization
         // "https://ex.co/s3.png", // AI-assisted decision support
      ],

      primaryCategory: "financial",
      tags: [
         "crypto",
         "smart-wallet",
         "financial-safety",
         "expense-tracking",
         "ai-assistance",
         "multisig",
      ],

      heroImageUrl: URL + "/logo.png",
      tagline: "Crypto with guardrails",

      ogTitle: "CommonWealth — Crypto with Guardrails",
      ogDescription:
         "A smart contract wallet designed for real people. Spend intentionally, track on-chain finances, and get decision support without surrendering control to automation.",
      ogImageUrl: URL + "/logo.png",

      noindex: false,
      },

	}); // see the next step for the manifest_json_object
}
