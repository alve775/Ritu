'use client';
import Link from 'next/link';
import Image from 'next/image';
import rituLogo from '../../public/website_logo.jpg';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
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
import { StepProgress } from './ui/step-progress';
import { BottomTabBar } from './ui/bottom-tab-bar';
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
  } = usePlanner();
  const saved = farmSaved && demoSaved && journeySaved;
  const [modal, setModal] = useState<'about' | null>(null);
  const stepPath = path === '/insights' ? '/plan' : path;
  const nav = [
    {
      href: '/farm',
      label: t('Your farm', 'আপনার জমি'),
      icon: House,
    },
    {
      href: '/crops',
      label: t('Crops', 'ফসল'),
      icon: Sprout,
    },
    {
      href: '/plan',
      label: t('Calendar', 'ক্যালেন্ডার'),
      icon: Layers3,
    },
    {
      href: '/track',
      label: t('Track', 'হিসাব'),
      icon: ClipboardCheck,
    },
  ];
  return (
    <div className={`app ${language === 'bn' ? 'bangla' : ''}`}>
      <a className="skip-link" href="#main">
        {t('Skip to content', 'মূল অংশে যান')}
      </a>
      <header className="app-header">
        <div className="app-header-inner">
          <Link className="brand" href="/" aria-label={t('Ritu home', 'ঋতু হোম')}>
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
          <StepProgress items={nav} path={stepPath} label={t('Main navigation', 'মূল নেভিগেশন')} />
          <div className="header-tools">
            <TourGuide />
            <ReadingControls />
            <div className="language-switch" role="group" aria-label={t('Language', 'ভাষা')}>
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
        </div>
      </header>
      <main id="main" className="main-content" tabIndex={-1}>
        {ready ? children : <p role="status">{t('Loading your farm…', 'জমির তথ্য লোড হচ্ছে…')}</p>}
      </main>
      <footer className="footer">
        <div className="footer-inner">
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
            <ResetDataControl compact />
          </span>
          <button className="preview-badge" onClick={() => setModal('about')}>
            <CircleAlert size={16} aria-hidden="true" />
            {t('Illustrative preview', 'উদাহরণভিত্তিক প্রিভিউ')}
          </button>
        </div>
      </footer>
      <BottomTabBar items={nav} path={stepPath} label={t('Main navigation', 'মূল নেভিগেশন')} />
      {modal === 'about' && (
        <Dialog
          title={t('A preview with a purpose.', 'উদ্দেশ্যপূর্ণ এক প্রিভিউ।')}
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
              <strong>{t('All examples are illustrative.', 'সব উদাহরণ প্রতীকী।')}</strong>
              <p>
                {t(
                  'This is an example farm. Crop matching and dates use authored rules. Dates are assigned automatically and checked for overlap. No NASA observations or verified farming recommendations are included.',
                  'এটি একটি উদাহরণ জমি। ফসলের মিল ও সময় হাতে তৈরি নিয়মে তৈরি। সময় স্বয়ংক্রিয়ভাবে ঠিক হয় এবং সংঘাত যাচাই হয়। নাসার পর্যবেক্ষণ বা যাচাইকৃত কৃষি পরামর্শ নেই।',
                )}
              </p>
            </div>
          </div>
          <h3>{t('What is ready', 'যা প্রস্তুত')}</h3>
          <p>
            {t(
              'Enter farm conditions, choose suggested crops, compare automatic calendars, try scenarios and track planting, harvest and notes. Your input is stored in this browser only.',
              'জমির শর্ত দিন, প্রস্তাবিত ফসল বাছুন, স্বয়ংক্রিয় ক্যালেন্ডার তুলনা করুন, পরিস্থিতি বদলান এবং রোপণ, ফসল কাটা ও নোট রাখুন। তথ্য শুধু এই ব্রাউজারে থাকে।',
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
    </div>
  );
}
