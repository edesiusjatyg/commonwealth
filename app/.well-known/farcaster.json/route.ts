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
         splashBackgroundColor: "#dedeff",
         webhookUrl: URL + "/api/webhook",

         subtitle: "Human-first crypto wallets",
         description:
            "A wallet that brings financial awareness and decision support to on-chain money. Set spending limits, track expenses, and make informed crypto decisions assisted by AI.",

         screenshotUrls: [
            URL + "/showcase-1.jpeg",
            URL + "/showcase-2.jpeg",
         ],

         primaryCategory: "finance",
         tags: [
            "crypto",
            "wallet",
            "financial",
            "expensetracking",
            "multisig",
         ],

         heroImageUrl: URL + "/showcase-1.jpeg",
         tagline: "Crypto with guardrails",

         ogTitle: "CommonWealth",
         ogDescription:
            "A wallet that brings financial awareness and decision support to on-chain money.",
         ogImageUrl: URL + "/logo.png",

         noindex: false,
      },

   }); // see the next step for the manifest_json_object
}
