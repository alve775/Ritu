'use client';
// Client component only because the language state lives on the client.
import '../../styles/pages/landing.css';
import { LandingView } from '../../components/landing/landing-view';
import { LanguageSwitch } from '../../components/language-switch';
import { usePlanner } from '../../components/planner-provider';

export default function HomePage() {
  const { language } = usePlanner();
  // "/plan?example=1" is not handled yet (README step 2.5), so the sample goes to the prefilled farm.
  return <LandingView lang={language} languageSwitch={<LanguageSwitch />} sampleHref="/farm" />;
}
