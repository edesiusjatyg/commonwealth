function withValidProperties(
   properties: Record<string, undefined | string | string[]>,
) {
   return Object.fromEntries(
      Object.entries(properties).filter(([_, value]) =>
         Array.isArray(value) ? value.length > 0 : !!value,
      ),
   );
}

export async function GET() {
   const URL = process.env.NEXT_PUBLIC_URL as string;
   return Response.json({
      accountAssociation: {
         header: "eyJmaWQiOi0xLCJ0eXBlIjoiYXV0aCIsImtleSI6IjB4QzcxMzMwRThENThGMzlmRTA1NjUzMDcxNjM3ZWFFREFCMzMxMzUxYyJ9",
         payload: "eyJkb21haW4iOiJjb21tb253ZWFsdGgtYmV0YS52ZXJjZWwuYXBwIn0",
         signature: "AAAAAAAAAAAAAAAAyhG94Fl3s2MRZwKIYr4qFzl2yhEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAALAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAiSCrVbLAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAul7REO_bo9AFv8iC11NYrLu4WEIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASQ_-6NvAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAVXyZfzzmAFpfBR87HZNDl-eFTWMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAPhSELIcxQMC9He6VmhtIBncm2etAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABBOC6ekOporvTB7tfDtdegtT1Fn16SvfIHyW-i5lagzl0nwYtdwL5ScPAE1sdmyupFyJyUaU_vzDzJ35Nme86QHBwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAZJJkkmSSZJJkkmSSZJJkkmSSZJJkkmSSZJJkkmSSZJI"
      },
      miniapp: {
         version: "1",
         name: "CommonWealth",
         homeUrl: URL,
         iconUrl: URL + "/logo.png",
         imageUrl: URL + "/showcase-1.jpeg",
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

   });
}
