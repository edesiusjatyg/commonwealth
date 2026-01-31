
export interface OnboardingSlide {
  id: string;
  title: string;
  description?: string;
  cards?: { title: string; description: string; icon?: string }[];
}

export const onboardingSlides: OnboardingSlide[] = [
  {
    id: 'welcome',
    title: 'Welcome to CommonWealth',
    description: "Your secure gateway to managing crypto assets, building wealth, and tracking your finances all in one place.",
  },
  {
    id: 'features',
    title: 'Powerful Features',
    description: "Wallet-level safety controls using smart contracts, daily spending limits, automatic wallet locking when limits are reached, and emergency approval through a trusted contact using a multi-signature mechanism.",
  },
  {
    id: 'safety',
    title: 'Guarantee Safety',
    description: "Every balance change is automatically tracked and organized. We turn raw blockchain activity into clear spending categories, so you can actually understand your habits and protect yourself from mistakes, impulse decisions, and the unexpected.",
  },
  {
    id: 'council',
    title: 'The CommonWealth Council',
    description: "A group of specialized AI advisors providing financial insight while keeping decisions in your hands.",
    cards: [
        {
            title: "The Oracle",
            description: "Financial Stability Advisor. Monitors spending behavior and risks."
        },
        {
            title: "Nostradamus",
            description: "Market Foresight Advisor. Analyzes market sentiment and macro trends."
        },
        {
            title: "Scribe",
            description: "Explanation & Interaction Advisor. Translates complex data into clear language."
        }
    ]
  },
];
