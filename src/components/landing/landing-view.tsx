import Link from 'next/link';
import Image from 'next/image';
import type { ReactNode } from 'react';
import rituLogo from '../../../public/website_logo.jpg';
import { ArrowRight } from 'lucide-react';
import { FieldArt } from './field-art';
import { SeasonRibbon, SAMPLE_PLAN } from '../season-ribbon';
import type { Language } from '../../domain/types';

const COPY = {
  en: {
    eyebrow: "Crop planning for Bangladesh's three seasons",
    titleA: 'Know what to plant,',
    titleB: 'every season.',
    lede: 'Tell Ritu about your water and soil. It picks a crop for Kharif I, Kharif II and Rabi, and shows you why each one fits.',
    cta: 'Plan my season',
    secondary: 'See a sample plan',
    field: 'Your field',
    range: 'Mar → Feb',
    rotation: 'Mung bean → Aman rice → Mustard',
    place: '24.37° N · 88.60° E',
    artLabel: 'Aerial view of farmland strips, a village pond and a canal',
    ribbonLabel:
      'Sample plan: mung bean March to April, rest, Aman rice July to October, mustard November to January, rest in February',
    home: 'Ritu home',
  },
  bn: {
    eyebrow: 'বাংলাদেশের তিন মৌসুমের ফসল পরিকল্পনা',
    titleA: 'প্রতি মৌসুমে জানুন,',
    titleB: 'কী লাগাবেন।',
    lede: 'পানি আর মাটির কথা বলুন। খরিফ-১, খরিফ-২ আর রবিতে কোন ফসল মানাবে, কারণসহ দেখাবে ঋতু।',
    cta: 'পরিকল্পনা শুরু করুন',
    secondary: 'নমুনা পরিকল্পনা দেখুন',
    field: 'আপনার জমি',
    range: 'মার্চ → ফেব্রুয়ারি',
    rotation: 'মুগ → আমন ধান → সরিষা',
    place: 'রাজশাহী',
    artLabel: 'ওপর থেকে দেখা জমি, পুকুর আর খাল',
    ribbonLabel:
      'নমুনা পরিকল্পনা: মার্চ–এপ্রিল মুগ, তারপর বিশ্রাম, জুলাই–অক্টোবর আমন ধান, নভেম্বর–জানুয়ারি সরিষা, ফেব্রুয়ারি বিশ্রাম',
    home: 'ঋতু প্রথম পাতা',
  },
} as const;

type Props = {
  lang: Language;
  /** Pass the app's existing EN / বাংলা switch so the landing page and planner share one language state. */
  languageSwitch: ReactNode;
  /** Where "See a sample plan" goes. See README, step 2. */
  sampleHref?: string;
};

export function LandingView({ lang, languageSwitch, sampleHref = '/plan?example=1' }: Props) {
  const t = COPY[lang];
  return (
    <div className="landing" lang={lang}>
      <header className="landing__header">
        <Link href="/" className="brand" aria-label={t.home}>
          <span className="brand-chip">
            <Image
              className="brand-logo"
              src={rituLogo}
              alt="RITU · ঋতু"
              sizes="120px"
              loading="eager"
            />
          </span>
        </Link>
        {languageSwitch}
      </header>

      <div className="landing__art">
        <FieldArt label={t.artLabel} />
        <span className="landing__place">{t.place}</span>
        <div className="landing__plan-card">
          <div className="landing__plan-head">
            <span>{t.field}</span>
            <span>{t.range}</span>
          </div>
          <SeasonRibbon segments={SAMPLE_PLAN} size="sm" label={t.ribbonLabel} />
          <span className="landing__plan-rotation">{t.rotation}</span>
        </div>
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
          <Link href="/farm" className="landing__cta">
            {t.cta}
            <ArrowRight size={20} strokeWidth={2.4} aria-hidden="true" />
          </Link>
          <Link href={sampleHref} className="landing__secondary">
            {t.secondary}
          </Link>
        </div>
      </section>
    </div>
  );
}
