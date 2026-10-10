'use client';
import { useState } from 'react';
import { Search, Sprout } from 'lucide-react';
import { usePlanner } from './planner-provider';
import { Dialog } from './dialog';
import { previewData } from '../data/preview';
import { cropCategories } from '../data/crop-catalogue';
import { cropModelNotes } from '../data/crop-models';
import type { Crop, CropCategory } from '../domain/types';

const allCrops = Object.values(previewData.crops)
  .filter((c) => c.id !== 'fallow')
  .sort((a, b) => a.name.en.localeCompare(b.name.en));
export function CropCatalogue() {
  const { t, language } = usePlanner();
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState<CropCategory | 'all'>('all');
  const [limit, setLimit] = useState(8);
  const [active, setActive] = useState<Crop | null>(null);
  const matches = allCrops.filter(
    (c) =>
      (group === 'all' || c.category === group) &&
      `${c.name.en} ${c.name.bn}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
  );
  return (
    <details className="disclosure crop-catalogue">
      <summary>{t(`Browse ${allCrops.length} crops`, `${allCrops.length}টি ফসল দেখুন`)}</summary>
      <section className="catalogue-browser" aria-label={t('Crop catalogue', 'ফসলের তালিকা')}>
        <h2>{t('Crop reference library', 'ফসলের তথ্যভান্ডার')}</h2>
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
                  'জমির দৃশ্যে নিজেদের তৈরি প্রতীকী গঠনের মডেল আছে।',
                )
              : t(
                  'Anatomy model not available yet. This reference does not establish a planting window.',
                  'গঠনের মডেল এখনো নেই। এই উৎস রোপণের সময় নিশ্চিত করে না।',
                )}
          </p>
          {active.reference && (
            <p>
              <a href={active.reference.url} target="_blank" rel="noopener noreferrer">
                {active.reference.name}
              </a>
            </p>
          )}
        </Dialog>
      )}
    </details>
  );
}
