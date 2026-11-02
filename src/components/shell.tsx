'use client';
import Link from 'next/link';
import Image from 'next/image';
import rituLogo from '../../public/website_logo.jpg';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import {
  Check,
  CircleAlert,
  CircleHelp,
  Earth,
  House,
  Layers3,
  Sprout,
  ClipboardCheck,
} from 'lucide-react';
import { usePlanner } from './planner-provider';
import { Dialog } from './dialog';
import { TourGuide } from './tour-guide';
import { ReadingControls } from './reading-controls';
import { ResetDataControl } from './reset-data-control';
import { LanguageSwitch } from './language-switch';
import { StepProgress } from './ui/step-progress';
import { BottomTabBar } from './ui/bottom-tab-bar';
import { EvidenceSourcesView } from './evidence-views';
import { useSeasonFarms } from '../lib/season-store';

export function Shell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const planner = usePlanner();
  const { t, language, saved: farmSaved, demoSaved, journeySaved, ready } = planner;
  const season = useSeasonFarms();
  const saved = farmSaved && demoSaved && journeySaved && season.saved;
  const [modal, setModal] = useState<'about' | null>(null);
  const stepPath = path === '/track' ? '/plan' : path;
  const nav = [
    {
      href: '/farm',
      completed: !!season.state.confirmedKey,
      label: t('Land details', 'জমির তথ্য'),
      icon: House,
      description: t('Soil, water & location', 'মাটি, সেচ ও স্থান'),
    },
    {
      href: '/crops',
      completed: season.state.farms.length > 0,
      label: t('Suggested crops', 'প্রস্তাবিত ফসল'),
      icon: Sprout,
      description: t('Choose one crop for a season', 'এক মৌসুমের একটি ফসল বাছুন'),
    },
    {
      href: '/plan',
      completed: season.state.farms.length > 0,
      label: t('Farm calendar', 'খামারের ক্যালেন্ডার'),
      icon: Layers3,
      description: t('Daily checks & weather', 'দৈনিক যাচাই ও আবহাওয়া'),
    },
    {
      href: '/farms',
      label: t('My farms', 'আমার খামার'),
      icon: ClipboardCheck,
      description: t('Manage fields & seasons', 'জমি ও মৌসুম পরিচালনা'),
    },
  ];
  const stepIndex = nav.findIndex((item) => item.href === stepPath);
  const pageTitle =
    stepIndex >= 0
      ? `${t('Step', 'ধাপ')} ${stepIndex + 1} ${t('of 4', '/ ৪')} · ${nav[stepIndex].label} — RITU`
      : t('Data sources & methods — RITU', 'তথ্যের উৎস ও পদ্ধতি — ঋতু');
  useEffect(() => {
    document.title = pageTitle;
  }, [pageTitle]);
  return (
    <div className={`app ${language === 'bn' ? 'bangla' : ''}`}>
      <a className="skip-link" href="#main">
        {t('Skip to content', 'মূল অংশে যান')}
      </a>
      <header className="app-header">
        <div className="app-header-inner">
          <Link className="brand header-brand" href="/" aria-label={t('Ritu home', 'ঋতু হোম')}>
            <Image
              className="brand-logo"
              src={rituLogo}
              alt="RITU · ঋতু"
              sizes="180px"
              loading="eager"
            />
          </Link>
          <p className="header-context">
            {stepIndex >= 0
              ? `${t('Step', 'ধাপ')} ${stepIndex + 1} ${t('of 4', '/ ৪')} · ${nav[stepIndex].label}`
              : t('Sources & methods', 'উৎস ও পদ্ধতি')}
          </p>
          <div className="header-tools">
            <TourGuide />
            <ReadingControls />
            <LanguageSwitch />
            <button
              className="icon-button help-button"
              aria-label={t('About the data', 'তথ্য সম্পর্কে')}
              onClick={() => setModal('about')}
            >
              <CircleHelp size={20} />
            </button>
          </div>
        </div>
      </header>
      <aside className="planner-sidebar">
        <Link className="brand sidebar-brand" href="/" aria-label={t('Ritu home', 'ঋতু হোম')}>
          <Image
            className="brand-logo"
            src={rituLogo}
            alt="RITU · ঋতু"
            sizes="180px"
            loading="eager"
          />
        </Link>
        <p className="sidebar-heading">{t('YOUR SEASON PLAN', 'আপনার মৌসুমের পরিকল্পনা')}</p>
        <StepProgress items={nav} path={stepPath} label={t('Main navigation', 'মূল নেভিগেশন')} />
        <div className="sidebar-source">
          <button className="text-button" onClick={() => setModal('about')}>
            <Earth size={18} /> {t('Sources & limits', 'উৎস ও সীমা')}
          </button>
          <small>NASA POWER · FAO ECOCROP · SAGE · Open-Meteo</small>
        </div>
      </aside>
      <main id="main" className="main-content" tabIndex={-1}>
        {stepIndex >= 0 && (
          <p className="workflow-step">
            {t('Step', 'ধাপ')} {stepIndex + 1} {t('of 4', '/ ৪')} · {nav[stepIndex].label}
          </p>
        )}
        {ready ? children : <p role="status">{t('Loading your farm…', 'জমির তথ্য লোড হচ্ছে…')}</p>}
      </main>
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-status">
            <span className={`save-indicator ${saved ? '' : 'unsaved'}`}>
              <Check size={16} aria-hidden="true" />
              {!ready
                ? t('Loading your plan…', 'পরিকল্পনা লোড হচ্ছে…')
                : saved
                  ? t('Saved on this device', 'এই ডিভাইসে সংরক্ষিত')
                  : t(
                      'Storage unavailable — keep this tab open',
                      'সংরক্ষণ সম্ভব নয় — এই ট্যাব খোলা রাখুন',
                    )}
            </span>
            <ResetDataControl compact />
          </div>
          <button className="preview-badge" onClick={() => setModal('about')}>
            <CircleAlert size={16} aria-hidden="true" />
            {t('Climate · crop · weather sources', 'জলবায়ু · ফসল · আবহাওয়ার উৎস')}
          </button>
        </div>
      </footer>
      <BottomTabBar items={nav} path={stepPath} label={t('Main navigation', 'মূল নেভিগেশন')} />
      {modal === 'about' && (
        <Dialog title={t('Sources & methods', 'উৎস ও পদ্ধতি')} onClose={() => setModal(null)}>
          <EvidenceSourcesView embedded onNavigate={() => setModal(null)} />
        </Dialog>
      )}
    </div>
  );
}
