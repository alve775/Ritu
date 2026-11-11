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
    titleA: 'Plan beyond',
    titleB: 'the next crop.',
    lede: 'Pin your land and add its plots. Ritu plans the whole year for each plot with NASA rain, soil-moisture and climate data, then gives you a daily calendar: when to sow, when to irrigate, and how much fertiliser to use.',
    cta: 'Open my dashboard',
    secondary: 'Explore data & methods',
    home: 'Ritu home',
  },
  bn: {
    eyebrow: 'আপনার জমি। আপনার ফসল। পরের চাষের মৌসুম।',
    titleA: 'পরের ফসল নয়,',
    titleB: 'পুরো বছর ভাবুন।',
    lede: 'জমির স্থান দিন, প্লট যোগ করুন। নাসার বৃষ্টি, মাটির আর্দ্রতা ও জলবায়ুর তথ্য দিয়ে ঋতু প্রতিটি প্লটের পুরো বছরের পরিকল্পনা করে, তারপর দেয় দৈনিক ক্যালেন্ডার: কবে বুনবেন, কবে সেচ দেবেন, কতটা সার দেবেন।',
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
