
import { OnboardingFlow } from '@/components/onboarding/onboarding-flow';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Welcome to CommonWealth',
  description: 'Your secure gateway to managing crypto assets, building wealth, and tracking your finances all in one place.',
};

export default function OnboardingPage() {
  return <OnboardingFlow />;
}
