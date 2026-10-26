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
import { evidencePlans } from '../domain/evidence-planner';
import { profileKey } from '../lib/evidence-store';

export function Shell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const planner = usePlanner();
  const {
    t,
    language,
    saved: farmSaved,
    demoSaved,
    journeySaved,
    ready,
    reviewed,
    tracked,
  } = planner;
  const saved = farmSaved && demoSaved && journeySaved;
  const [modal, setModal] = useState<'about' | null>(null);
  const stepPath = path;
  const cropReady =
    reviewed &&
    evidencePlans(
      planner.from,
      planner.preferred,
      planner.farm,
      planner.priority,
      planner.unplanted,
    ).length > 0;
  const nav = [
    {
      href: '/farm',
      completed: reviewed,
      label: t('Your farm', 'আপনার জমি'),
      icon: House,
      description: t('Soil, water & location', 'মাটি, সেচ ও স্থান'),
    },
    {
      href: '/crops',
      completed: cropReady,
      label: t('Crops', 'ফসল'),
      icon: Sprout,
      description: t('Published regional references', 'প্রকাশিত আঞ্চলিক তথ্য'),
    },
    {
      href: '/plan',
      completed: !!tracked && tracked.profileKey === profileKey(planner),
      label: t('Calendar', 'ক্যালেন্ডার'),
      icon: Layers3,
      description: t('Compare & save a plan', 'তুলনা ও পরিকল্পনা রাখুন'),
    },
    {
      href: '/track',
      label: t('Track', 'হিসাব'),
      icon: ClipboardCheck,
      description: t('Weather, actual dates & notes', 'আবহাওয়া, আসল দিন ও নোট'),
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
          <small>NASA POWER · Open-Meteo · DAE</small>
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
            {t('NASA · weather · DAE sources', 'নাসা · আবহাওয়া · কৃষি অধিদপ্তরের উৎস')}
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
