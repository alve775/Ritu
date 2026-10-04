'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Search, Sprout } from 'lucide-react';
import { usePlanner } from './planner-provider';
import { Dialog } from './dialog';
import { months, previewData } from '../data/preview';
import { cropCategories } from '../data/crop-catalogue';
import { cropModelNotes } from '../data/crop-models';
import type { Crop, CropCategory } from '../domain/types';

const allCrops = Object.values(previewData.crops)
  .filter((c) => c.id !== 'fallow')
  .sort((a, b) => a.name.en.localeCompare(b.name.en));
export function CropCatalogue() {
  const { t, language, farm, setFarm, select } = usePlanner();
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState<CropCategory | 'all'>('all');
  const [limit, setLimit] = useState(8);
  const [active, setActive] = useState<Crop | null>(null);
  const [start, setStart] = useState('');
  const [duration, setDuration] = useState('');
  const [added, setAdded] = useState('');
  const matches = allCrops.filter(
    (c) =>
      (group === 'all' || c.category === group) &&
      `${c.name.en} ${c.name.bn}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
  );
  return (
    <details className="disclosure crop-catalogue">
      <summary>{t(`Browse ${allCrops.length} crops`, `${allCrops.length}টি ফসল দেখুন`)}</summary>
      <section className="catalogue-browser" aria-label={t('Crop catalogue', 'ফসলের তালিকা')}>
        <h2>{t('Find a crop for your own calendar', 'নিজের ক্যালেন্ডারের ফসল খুঁজুন')}</h2>
        <p>
          {t(
            'Bangladesh crop references, not a list of locally recommended crops. Dates and suitability need your records and local review.',
            'বাংলাদেশের ফসলের উৎস, স্থানীয় সুপারিশের তালিকা নয়। সময় ও উপযোগিতা নিজের তথ্য ও স্থানীয়ভাবে যাচাই দরকার।',
          )}
        </p>
        <div className="catalogue-controls">
          <label>
            <Search size={20} aria-hidden="true" />
            {t('Search crops', 'ফসল খুঁজুন')}
            <input
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setLimit(8);
              }}
              placeholder={t('English or বাংলা', 'বাংলা বা English')}
            />
          </label>
          <label>
            {t('Crop group', 'ফসলের ধরন')}
            <select
              value={group}
              onChange={(event) => {
                setGroup(event.target.value as CropCategory | 'all');
                setLimit(8);
              }}
            >
              <option value="all">{t('All crop groups', 'সব ফসলের ধরন')}</option>
              {Object.entries(cropCategories)
                .filter(([id]) => id !== 'rest')
                .map(([id, name]) => (
                  <option key={id} value={id}>
                    {name[language]}
                  </option>
                ))}
            </select>
          </label>
        </div>
        <p role="status">
          {t(`${matches.length} crops found`, `${matches.length}টি ফসল পাওয়া গেছে`)}
        </p>
        <div className="catalogue-results">
          {matches.slice(0, limit).map((crop) => (
            <button
              className="catalogue-crop"
              key={crop.id}
              aria-label={`${t('Inspect crop', 'ফসল দেখুন')}: ${crop.name[language]}`}
              onClick={() => {
                setActive(crop);
                setStart('');
                setDuration('');
                setAdded('');
              }}
            >
              <Sprout size={24} aria-hidden="true" />
              <span>
                <strong>{crop.name[language]}</strong>
                <span>{cropCategories[crop.category!][language]}</span>
              </span>
            </button>
          ))}
        </div>
        {!matches.length && (
          <p>
            {t('Try a shorter name or another crop group.', 'ছোট নাম বা অন্য ধরন দিয়ে খুঁজুন।')}
          </p>
        )}
        {matches.length > limit && (
          <button className="button secondary" onClick={() => setLimit((n) => n + 8)}>
            {t('Show more crops', 'আরও ফসল দেখুন')}
          </button>
        )}
        {added && (
          <p role="status">
            {added} <Link href="/farm">{t('Review my calendar', 'ক্যালেন্ডার দেখুন')}</Link>
          </p>
        )}
      </section>
      {active && (
        <Dialog title={active.name[language]} onClose={() => setActive(null)}>
          <p>{active.description[language]}</p>
          <p>
            {t('Botanical family', 'উদ্ভিদ পরিবার')}: {active.family[language]}
          </p>
          <p>
            {cropModelNotes[active.id]
              ? t(
                  'An original schematic anatomy model is available in the field explorer.',
                  'জমির দৃশ্যে নিজেদের তৈরি প্রতীকী গঠনের নমুনা আছে।',
                )
              : t(
                  'Anatomy model not available yet. Calendar editing is available.',
                  'গঠনের নমুনা এখনো নেই। ক্যালেন্ডার বদলানো যায়।',
                )}
          </p>
          {active.reference && (
            <p>
              <a href={active.reference.url} target="_blank" rel="noopener noreferrer">
                {active.reference.name}
              </a>
            </p>
          )}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (!start || !duration || farm.current.length >= 12) return;
              setFarm({
                current: [
                  ...farm.current,
                  { crop: active.id, start: Number(start), duration: Number(duration) },
                ],
              });
              select('current');
              setAdded(
                t(
                  `${active.name.en} added with your dates. Review calendar conflicts.`,
                  `${active.name.bn} আপনার সময় দিয়ে যোগ হয়েছে। ক্যালেন্ডারের সংঘাত দেখুন।`,
                ),
              );
              setActive(null);
            }}
          >
            <h3>{t('Add using your own dates', 'নিজের সময় দিয়ে যোগ করুন')}</h3>
            <p>
              {t(
                'Choose both fields. No dates are suggested. The calendar repeats March–February and supports periods of up to 12 months; longer crops need a future multi-year planner.',
                'দুটি ঘরই বাছুন। সময়ের পরামর্শ নেই। ক্যালেন্ডার মার্চ–ফেব্রুয়ারি পুনরাবৃত্ত হয়; সর্বোচ্চ ১২ মাসের সময় রাখা যায়। দীর্ঘ ফসলের জন্য ভবিষ্যতে বহু বছরের পরিকল্পনা দরকার।',
              )}
            </p>
            <div className="catalogue-controls">
              <label>
                {t('Your start month', 'আপনার শুরুর মাস')}
                <select required value={start} onChange={(event) => setStart(event.target.value)}>
                  <option value="">{t('Choose a month', 'মাস বাছুন')}</option>
                  {months[language].map((month, i) => (
                    <option key={i} value={String(i)}>
                      {month}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {t('Your duration in months', 'আপনার সময়কাল মাসে')}
                <select
                  required
                  value={duration}
                  onChange={(event) => setDuration(event.target.value)}
                >
                  <option value="">{t('Choose a duration', 'সময়কাল বাছুন')}</option>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i} value={i + 1}>
                      {i + 1}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <button
              className="button primary"
              type="submit"
              disabled={!start || !duration || farm.current.length >= 12}
            >
              {t('Add to my current calendar', 'বর্তমান ক্যালেন্ডারে যোগ করুন')}
            </button>
            {farm.current.length >= 12 && (
              <p>
                {t(
                  'Your calendar has 12 periods. Remove one in Your farm before adding another.',
                  'ক্যালেন্ডারে ১২টি সময় আছে। আরেকটি যোগ করতে খামারের অংশে একটি বাদ দিন।',
                )}
              </p>
            )}
          </form>
        </Dialog>
      )}
    </details>
  );
}
