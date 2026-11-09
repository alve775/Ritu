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
  Layers3,
  Sprout,
  LayoutDashboard,
  NotebookPen,
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
import { useFieldLog } from '../lib/field-log-store';
import { dueReminders } from '../domain/field-log';
import { localDigits } from '../domain/numerals';
import { ReminderAlert } from './notes/reminder-alert';
import { useToday } from '../lib/use-today';

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
  // Once the open plot has a year plan, step 2 shows that plan instead of suggestions,
  // and visiting it no longer locks the calendar.
  const hasPlan = !!season.state.plots?.find((p) => p.id === season.state.draftPlotId)?.plan;
  const inSetup = path === '/farm' || path === '/plot' || (path === '/crops' && !hasPlan);
  const activeFarm =
    !inSetup &&
    season.state.calendarAccessId === season.state.activeId &&
    season.state.farms.some((farm) => farm.id === season.state.activeId);
  useEffect(() => {
    if (loaded && inSetup) seasonStore.revokeCalendar();
  }, [loaded, inSetup]);
  const redirect =
    path === '/crops' && !landConfirmed
      ? '/farms'
      : (path === '/plan' || path === '/track') && !activeFarm
        ? landConfirmed
          ? '/crops'
          : '/farms'
        : null;
  useEffect(() => {
    if (loaded && redirect) router.replace(redirect);
  }, [loaded, redirect, router]);
  const saved = farmSaved && demoSaved && journeySaved && season.saved;
  const [modal, setModal] = useState<'about' | null>(null);
  // Lands and plots are set up from the dashboard, so they stay under step 1.
  const stepPath =
    path === '/track' ? '/plan' : path === '/plot' || path === '/farm' ? '/farms' : path;
  const subPage =
    path === '/plot' ? ` · ${t('Plot', 'প্লট')}` : path === '/farm' ? ` · ${t('Land', 'জমি')}` : '';
  const fieldLog = useFieldLog();
  const deviceToday = useToday(Intl.DateTimeFormat().resolvedOptions().timeZone);
  // Notes of a plot no longer used do not count.
  const dueCount = fieldLog.ready
    ? dueReminders(
        fieldLog.state.notes.filter(
          (n) =>
            !season.state.plots?.some(
              (p) => p.id === n.plotId && !!p.endDate && p.endDate < deviceToday,
            ),
        ),
        deviceToday,
      ).length
    : 0;
  const nav = [
    {
      href: '/farms',
      completed: landConfirmed,
      label: t('Dashboard', 'ড্যাশবোর্ড'),
      icon: LayoutDashboard,
      description: t('Your lands & plots', 'আপনার জমি ও প্লট'),
    },
    {
      href: '/crops',
      completed: activeFarm,
      lockedReason: !landConfirmed ? t('Open a plot first', 'আগে একটি প্লট খুলুন') : undefined,
      label: hasPlan ? t('Your plan', 'আপনার পরিকল্পনা') : t('Suggested plans', 'পরামর্শ'),
      icon: Sprout,
      description: hasPlan
        ? t('This year’s crops and why', 'এ বছরের ফসল ও কারণ')
        : t('Crops for the whole year', 'পুরো বছরের ফসল'),
    },
    {
      href: '/plan',
      lockedReason: !activeFarm
        ? t('Choose a crop for a plot first', 'আগে প্লটের জন্য ফসল বাছুন')
        : undefined,
      label: t('Crop calendar', 'ফসলের ক্যালেন্ডার'),
      icon: Layers3,
      description: t('Daily checks & weather', 'দৈনিক যাচাই ও আবহাওয়া'),
    },
    {
      href: '/notes',
      lockedReason: !season.state.plots?.length
        ? t('Add a plot first', 'আগে একটি প্লট যোগ করুন')
        : undefined,
      label: t('Your notes', 'আপনার নোট'),
      icon: NotebookPen,
      description: t('Notes & reminders', 'নোট ও রিমাইন্ডার'),
      badge: dueCount ? localDigits(dueCount, language) : undefined,
    },
  ];
  const steps = nav;
  const stepIndex = steps.findIndex((item) => item.href === stepPath);
  const stepNumber = localDigits(stepIndex + 1, language);
  const stepCount = t(`of ${steps.length}`, `/ ${localDigits(steps.length, 'bn')}`);
  const pageTitle =
    stepIndex >= 0
      ? `${t('Step', 'ধাপ')} ${stepNumber} ${stepCount} · ${steps[stepIndex].label}${subPage} — RITU`
      : path === '/notes'
        ? t('Your notes — RITU', 'আপনার নোট — ঋতু')
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
              ? `${t('Step', 'ধাপ')} ${stepNumber} ${stepCount} · ${steps[stepIndex].label}${subPage}`
              : path === '/notes'
                ? t('Your notes', 'আপনার নোট')
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
            {t('Step', 'ধাপ')} {stepNumber} {stepCount} · {steps[stepIndex].label}
            {subPage}
          </p>
        )}
        {loaded && !redirect ? (
          children
        ) : (
          <p role="status">
            {redirect
              ? t('Opening the next required step…', 'আগে প্রয়োজনীয় ধাপ খোলা হচ্ছে…')
              : t('Loading your lands…', 'জমির তথ্য লোড হচ্ছে…')}
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
      {loaded && <ReminderAlert />}
      {modal === 'about' && (
        <Dialog title={t('Sources & methods', 'উৎস ও পদ্ধতি')} onClose={() => setModal(null)}>
          <EvidenceSourcesView embedded onNavigate={() => setModal(null)} />
        </Dialog>
      )}
    </div>
  );
}
