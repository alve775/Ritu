'use client';
// Client component only because the language state lives on the client.
import '../../styles/pages/landing.css';
import '../../styles/pages/farm-scene.css';
import { LandingView } from '../../components/landing/landing-view';
import { LanguageSwitch } from '../../components/language-switch';
import { usePlanner } from '../../components/planner-provider';

export default function HomePage() {
  const { language } = usePlanner();
  return <LandingView lang={language} languageSwitch={<LanguageSwitch />} sourceHref="/sources" />;
}
