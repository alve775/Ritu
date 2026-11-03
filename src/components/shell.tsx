'use client';
import Link from 'next/link';
import Image from 'next/image';
import rituLogo from '../../public/website_logo.jpg';
import { usePathname, useRouter } from 'next/navigation';
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
  LayoutDashboard,
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
import { useSeasonFarms, seasonStore } from '../lib/season-store';
import { fieldConfirmationKey } from '../domain/field-confirmation';
import { localToday } from '../domain/global-season';

export function Shell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const planner = usePlanner();
  const { t, language, saved: farmSaved, demoSaved, journeySaved, ready } = planner;
  const season = useSeasonFarms();
  const router = useRouter();
  const loaded = ready && season.ready;
  const landConfirmed =
    !!planner.site &&
    season.state.confirmedKey ===
      fieldConfirmationKey(
        planner.farm,
        planner.site,
        planner.from || localToday(planner.site.timezone),
      );
  const inSetup = path === '/farm' || path === '/crops';
  const activeFarm =
    !inSetup &&
    season.state.calendarAccessId === season.state.activeId &&
    season.state.farms.some((farm) => farm.id === season.state.activeId);
  useEffect(() => {
    if (loaded && inSetup) seasonStore.revokeCalendar();
  }, [loaded, inSetup]);
  const redirect =
    path === '/crops' && !landConfirmed
      ? '/farm'
      : (path === '/plan' || path === '/track') && !activeFarm
        ? landConfirmed
          ? '/crops'
          : '/farm'
        : null;
  useEffect(() => {
    if (loaded && redirect) router.replace(redirect);
  }, [loaded, redirect, router]);
  const saved = farmSaved && demoSaved && journeySaved && season.saved;
  const [modal, setModal] = useState<'about' | null>(null);
  const stepPath = path === '/track' ? '/plan' : path;
  const nav = [
    {
      href: '/farms',
      label: t('Dashboard', 'ড্যাশবোর্ড'),
      icon: LayoutDashboard,
      description: t('My farms & seasons', 'আমার খামার ও মৌসুম'),
    },
    {
      href: '/farm',
      completed: landConfirmed,
      label: t('Land details', 'জমির তথ্য'),
      icon: House,
      description: t('Soil, water & location', 'মাটি, সেচ ও স্থান'),
    },
    {
      href: '/crops',
      completed: activeFarm,
      lockedReason: !landConfirmed
        ? t('Confirm land details first', 'আগে জমির তথ্য নিশ্চিত করুন')
        : undefined,
      label: t('Suggested crops', 'প্রস্তাবিত ফসল'),
      icon: Sprout,
      description: t('Choose one crop for a season', 'এক মৌসুমের একটি ফসল বাছুন'),
    },
    {
      href: '/plan',
      lockedReason: !activeFarm
        ? t('Choose a crop and create a farm first', 'আগে ফসল বেছে খামার তৈরি করুন')
        : undefined,
      label: t('Farm calendar', 'খামারের ক্যালেন্ডার'),
      icon: Layers3,
      description: t('Daily checks & weather', 'দৈনিক যাচাই ও আবহাওয়া'),
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
            <TourGuide key={path} enabled={loaded && !redirect} />
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
        {loaded && !redirect ? (
          children
        ) : (
          <p role="status">
            {redirect
              ? t('Opening the next required step…', 'আগে প্রয়োজনীয় ধাপ খোলা হচ্ছে…')
              : t('Loading your farm…', 'জমির তথ্য লোড হচ্ছে…')}
          </p>
        )}
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
