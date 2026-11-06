import Link from 'next/link';
import Image from 'next/image';
import type { ReactNode } from 'react';
import rituLogo from '../../../public/website_logo.jpg';
import { ArrowRight } from 'lucide-react';
import { GrowingScene } from './growing-scene';
import type { Language } from '../../domain/types';

const COPY = {
  en: {
    eyebrow: 'Your land. Your crop. Your next growing season.',
    titleA: 'Explore what to plant,',
    titleB: 'every season.',
    lede: 'Find your field anywhere in the world. Choose one crop for a season, then follow your own farm calendar, daily field checks and weather forecast.',
    cta: 'Open my dashboard',
    secondary: 'Explore data & methods',
    home: 'Ritu home',
  },
  bn: {
    eyebrow: 'আপনার জমি। আপনার ফসল। পরের চাষের মৌসুম।',
    titleA: 'প্রতি মৌসুমে দেখুন,',
    titleB: 'কী লাগাবেন।',
    lede: 'বিশ্বের যেকোনো স্থানে জমি খুঁজুন। এক মৌসুমের একটি ফসল বেছে নিজস্ব ক্যালেন্ডার, প্রতিদিনের যাচাই ও আবহাওয়ার পূর্বাভাস দেখুন।',
    cta: 'আমার ড্যাশবোর্ড খুলুন',
    secondary: 'তথ্য ও পদ্ধতি দেখুন',
    home: 'ঋতু প্রথম পাতা',
  },
} as const;

type Props = {
  lang: Language;
  /** Pass the app's existing EN / বাংলা switch so the landing page and planner share one language state. */
  languageSwitch: ReactNode;
  /** Where "Explore data & methods" goes. */
  sourceHref?: string;
};

export function LandingView({ lang, languageSwitch, sourceHref = '/sources' }: Props) {
  const t = COPY[lang];
  return (
    <div className="landing" lang={lang}>
      <header className="landing__header">
        <Link href="/" className="brand" aria-label={t.home}>
          <Image
            className="brand-logo"
            src={rituLogo}
            alt="RITU · ঋতু"
            sizes="180px"
            loading="eager"
          />
        </Link>
        {languageSwitch}
      </header>

      <div className="landing__art">
        <GrowingScene language={lang} />
      </div>

      <section className="landing__copy" aria-labelledby="landing-title">
        <p className="landing__eyebrow">
          <span className="landing__dot" aria-hidden="true" />
          {t.eyebrow}
        </p>
        <h1 id="landing-title" className="landing__title">
          {t.titleA}
          <br />
          <span>{t.titleB}</span>
        </h1>
        <p className="landing__lede">{t.lede}</p>
        <div className="landing__actions">
          <Link href="/farms" className="landing__cta">
            {t.cta}
            <ArrowRight size={20} strokeWidth={2.4} aria-hidden="true" />
          </Link>
          <Link href={sourceHref} className="landing__secondary">
            {t.secondary}
          </Link>
        </div>
      </section>
    </div>
  );
}
