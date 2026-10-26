import Link from 'next/link';
import Image from 'next/image';
import type { ReactNode } from 'react';
import rituLogo from '../../../public/website_logo.jpg';
import { ArrowRight } from 'lucide-react';
import { GrowingScene } from './growing-scene';
import type { Language } from '../../domain/types';

const COPY = {
  en: {
    eyebrow: "Crop planning for Bangladesh's three seasons",
    titleA: 'Explore what to plant,',
    titleB: 'every season.',
    lede: 'Start with your soil and water. Explore crops, compare complete seasonal calendars and keep track of your work.',
    cta: 'Plan my season',
    secondary: 'Explore data & methods',
    home: 'Ritu home',
  },
  bn: {
    eyebrow: 'বাংলাদেশের তিন মৌসুমের ফসল পরিকল্পনা',
    titleA: 'প্রতি মৌসুমে দেখুন,',
    titleB: 'কী লাগাবেন।',
    lede: 'মাটি ও পানি দিয়ে শুরু করুন। ফসল বাছুন, সম্পূর্ণ মৌসুমের ক্যালেন্ডার তুলনা করুন এবং কাজের হিসাব রাখুন।',
    cta: 'পরিকল্পনা শুরু করুন',
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
        <p className="landing__evidence">
          {lang === 'en'
            ? 'Plan with NASA weather history, current forecasts and published DAE crop calendars. Start with your own field; every planning reference has a source.'
            : 'নাসার ইতিহাস, বর্তমান পূর্বাভাস ও সরকারি পঞ্জিকা দিয়ে পরিকল্পনা করুন। নিজের জমি থেকে শুরু; প্রতিটি তথ্যের উৎস আছে।'}
        </p>
        <div className="landing__actions">
          <Link href="/farm" className="landing__cta">
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
