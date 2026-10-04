'use client';
import Link from 'next/link';
import Image from 'next/image';
import rituLogo from '../../public/Ritu_Logo.jpeg';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import type { ReactNode } from 'react';
import {
  ArrowUpRight,
  Check,
  ChevronRight,
  CircleHelp,
  Earth,
  House,
  Layers3,
  MapPin,
  RotateCcw,
  Sprout,
  ClipboardCheck,
} from 'lucide-react';
import { usePlanner } from './planner-provider';
import { Dialog } from './dialog';
import { TourGuide } from './tour-guide';
import { ReadingControls } from './reading-controls';
import { evidenceSources } from '../data/evidence';

export function Shell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const {
    t,
    language,
    setLanguage,
    saved: farmSaved,
    demoSaved,
    journeySaved,
    ready,
    reset,
  } = usePlanner();
  const saved = farmSaved && demoSaved && journeySaved;
  const [modal, setModal] = useState<'about' | 'reset' | null>(null);
  const nav = [
    {
      href: '/farm',
      label: t('Your farm', 'আপনার খামার'),
      detail: t('Start with what you know', 'জানা তথ্য দিয়ে শুরু করুন'),
      icon: House,
    },
    {
      href: '/crops',
      label: t('Crops', 'ফসল'),
      detail: t('Choose from your matches', 'মেলা ফসল বাছুন'),
      icon: Sprout,
    },
    {
      href: '/plan',
      label: t('Calendar', 'ক্যালেন্ডার'),
      detail: t('Compare assigned dates', 'নির্ধারিত সময় তুলনা'),
      icon: Layers3,
    },
    {
      href: '/track',
      label: t('Track', 'হিসাব'),
      detail: t('Record your progress', 'কাজের তথ্য রাখুন'),
      icon: ClipboardCheck,
    },
  ];
  return (
    <div className={`app ${language === 'bn' ? 'bangla' : ''}`}>
      <a className="skip-link" href="#main">
        {t('Skip to content', 'মূল অংশে যান')}
      </a>
      <aside className="sidebar" aria-label={t('Main navigation', 'মূল নেভিগেশন')}>
        <Link className="brand" href="/" aria-label={t('Ritu home', 'ঋতু হোম')}>
          <Image
            className="brand-logo"
            src={rituLogo}
            alt="RITU · ঋতু"
            sizes="180px"
            loading="eager"
          />
        </Link>
        <div className="sidebar-label">{t('YOUR SEASONAL PLAN', 'আপনার মৌসুমি পরিকল্পনা')}</div>
        <nav className="nav-list">
          {nav.map(({ href, label, detail, icon: Icon }, index) => (
            <Link
              key={href}
              href={href}
              className={`nav-item ${path === href ? 'active' : ''}`}
              aria-current={path === href ? 'page' : undefined}
            >
              <span className="nav-icon">
                <Icon size={19} />
              </span>
              <span className="nav-text">
                <strong>{label}</strong>
                <small>{detail}</small>
              </span>
              <span className="nav-number">0{index + 1}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="location">
            <MapPin size={15} />
            <span>{t('Made for Bangladesh', 'বাংলাদেশের জন্য')}</span>
          </div>
          <button className="text-button" onClick={() => setModal('about')}>
            {t('About this preview', 'এই নমুনা সম্পর্কে')}
            <ArrowUpRight size={14} />
          </button>
          <span className="version">{t('CONCEPT PREVIEW · V0.1', 'ধারণামূলক নমুনা · V0.1')}</span>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumb">
            <span>{t('Season planner', 'মৌসুমি পরিকল্পনা')}</span>
            <ChevronRight size={13} />
            <strong>{nav.find((n) => n.href === path)?.label ?? t('Ritu', 'ঋতু')}</strong>
          </div>
          <div className="topbar-actions">
            <TourGuide />
            <ReadingControls />
            <span className="preview-tag">
              <span />
              {t('Illustrative preview', 'নমুনা তথ্য')}
            </span>
            <div className="language-switch" aria-label={t('Language', 'ভাষা')}>
              <button onClick={() => setLanguage('en')} aria-pressed={language === 'en'}>
                EN
              </button>
              <button onClick={() => setLanguage('bn')} aria-pressed={language === 'bn'} lang="bn">
                বাংলা
              </button>
            </div>
            <button
              className="icon-button help-button"
              aria-label={t('About the data', 'তথ্য সম্পর্কে')}
              onClick={() => setModal('about')}
            >
              <CircleHelp size={20} />
            </button>
          </div>
        </header>
        <main id="main" className="main-content" tabIndex={-1}>
          {ready ? children : <p role="status">{t('Loading your farm…', 'খামার লোড হচ্ছে…')}</p>}
        </main>
        <footer className="footer">
          <span>
            <Sprout size={15} />
            {t('Thoughtful choices. Season by season.', 'ভেবেচিন্তে সিদ্ধান্ত। মৌসুমে মৌসুমে।')}
          </span>
          <div>
            <span className={`save-indicator ${saved ? '' : 'unsaved'}`}>
              <Check size={13} />
              {!ready
                ? t('Loading your plan…', 'পরিকল্পনা লোড হচ্ছে…')
                : saved
                  ? t('Saved on this device', 'এই ডিভাইসে সংরক্ষিত')
                  : t(
                      'Storage unavailable — keep this tab open',
                      'সংরক্ষণ সম্ভব নয় — এই ট্যাব খোলা রাখুন',
                    )}
            </span>
            <button className="text-button" onClick={() => setModal('reset')}>
              <RotateCcw size={12} />
              {t('Reset demo', 'নমুনা রিসেট')}
            </button>
          </div>
        </footer>
      </div>
      {modal === 'about' && (
        <Dialog
          title={t('A preview with a purpose.', 'উদ্দেশ্যপূর্ণ এক নমুনা।')}
          onClose={() => setModal(null)}
        >
          <span className="eyebrow">{t('TRANSPARENCY FIRST', 'স্বচ্ছতা সবার আগে')}</span>
          <p>
            {t(
              'Ritu helps you explore crop rotations around water access, seasonal timing and the food your household wants to keep.',
              'ঋতু আপনাকে সেচ, মৌসুমি সময় ও পরিবারের প্রয়োজনের ভিত্তিতে ফসলক্রম দেখতে সাহায্য করে।',
            )}
          </p>
          <div className="notice">
            <Earth size={23} />
            <div>
              <strong>{t('All examples are illustrative.', 'সব উদাহরণ নমুনাভিত্তিক।')}</strong>
              <p>
                {t(
                  'This is a fictional example farm. Crop matching and dates use authored mock rules. Dates are assigned automatically and checked for overlap. No NASA observations or verified farming recommendations are included.',
                  'এটি কাল্পনিক নমুনা খামার। ফসলের মিল ও সময় নমুনার নিয়মে তৈরি। সময় স্বয়ংক্রিয়ভাবে ঠিক হয় এবং সংঘাত যাচাই হয়। নাসার পর্যবেক্ষণ বা যাচাইকৃত কৃষি পরামর্শ নেই।',
                )}
              </p>
            </div>
          </div>
          <h3>{t('What is ready', 'যা প্রস্তুত')}</h3>
          <p>
            {t(
              'Enter farm conditions, choose suggested crops, compare automatic calendars, try scenarios and track planting, harvest and notes. Your input is stored in this browser only.',
              'খামারের শর্ত দিন, প্রস্তাবিত ফসল বাছুন, স্বয়ংক্রিয় ক্যালেন্ডার তুলনা করুন, পরিস্থিতি বদলান এবং রোপণ, ফসল কাটা ও নোট রাখুন। তথ্য শুধু এই ব্রাউজারে থাকে।',
            )}
          </p>
          <h3>{t('Sources & challenge status', 'উৎস ও চ্যালেঞ্জের অবস্থা')}</h3>
          <p>
            {t(
              'The published Field Shift summary calls for NASA Earth observations, local soil information, crop characteristics and farmer priorities. NASA data and local suitability rules are not yet integrated.',
              'প্রকাশিত Field Shift সারাংশে নাসার পৃথিবী পর্যবেক্ষণ, স্থানীয় মাটির তথ্য, ফসলের বৈশিষ্ট্য ও কৃষকের অগ্রাধিকার চাওয়া হয়েছে। নাসার তথ্য ও স্থানীয় উপযোগিতার শর্ত এখনো যুক্ত হয়নি।',
            )}
          </p>
          <ul className="model-references">
            {evidenceSources.slice(0, 4).map((source) => (
              <li key={source.url}>
                <a href={source.url} target="_blank" rel="noopener noreferrer">
                  {source.name}
                </a>
              </li>
            ))}
          </ul>
          <h3>{t('What comes next', 'এরপর যা যোগ হবে')}</h3>
          <p>
            {t(
              'Reviewed local crop calendars and soil rules; NASA rainfall and temperature histories; and feedback from farmers or agricultural advisers. No live NASA data, forecasts, yield estimates or measured water savings are included today.',
              'যাচাইকৃত স্থানীয় ফসলের সময় ও মাটির শর্ত, নাসার বৃষ্টি ও তাপমাত্রার ইতিহাস এবং কৃষক বা কৃষি পরামর্শকের মতামত যোগ হবে। এখন সরাসরি নাসার তথ্য, পূর্বাভাস, ফলনের হিসাব বা পরিমাপ করা পানি সাশ্রয় নেই।',
            )}
          </p>
          <div className="dialog-footer">
            {t(
              'Built by the Ritu team for the 2026 Space Apps project.',
              '২০২৬ স্পেস অ্যাপস প্রকল্পের জন্য ঋতু দলের তৈরি।',
            )}
          </div>
        </Dialog>
      )}
      {modal === 'reset' && (
        <Dialog title={t('Start fresh?', 'আবার শুরু করবেন?')} onClose={() => setModal(null)}>
          <p>
            {t(
              'This restores the sample farm and priorities and clears your crop choices, saved calendar, progress and notes on this device. Your language preference will stay.',
              'নমুনা খামার ও অগ্রাধিকার ফিরবে। এই ডিভাইসের বাছা ফসল, রাখা ক্যালেন্ডার, অগ্রগতি ও নোট মুছে যাবে। ভাষা একই থাকবে।',
            )}
          </p>
          <div className="button-row">
            <button className="button secondary" onClick={() => setModal(null)}>
              {t('Keep my plan', 'পরিকল্পনা রাখুন')}
            </button>
            <button
              className="button primary"
              onClick={() => {
                reset();
                setModal(null);
              }}
            >
              {t('Reset sample farm', 'নমুনা খামার রিসেট')}
            </button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
