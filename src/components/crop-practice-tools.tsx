'use client';
import { useState } from 'react';
import { usePlanner } from './planner-provider';
import { germination, mungBroadcastRates, mungGuide, seedQuantity } from '../data/crop-practices';
export function MungPracticeTools() {
  const { t, farm } = usePlanner();
  const [variety, setVariety] = useState(''),
    [healthy, setHealthy] = useState('');
  const quantity = seedQuantity(farm.area, variety),
    percent = healthy === '' ? null : germination(Number(healthy), 50);
  return (
    <details className="card practice-tools" data-tour="crop-tools">
      <summary>
        {t(
          'Practical mung bean tools · CIMMYT / CSISA',
          'মুগের বাস্তব কাজের সহায়তা · CIMMYT / CSISA',
        )}
      </summary>
      <p>
        {t(
          'These calculations use the named 2016 Bangladesh guide. Check your actual variety, seed quality, seed label and current local advice. No yield or water-saving result is predicted.',
          'এই গণনা নামসহ ২০১৬ সালের বাংলাদেশের নির্দেশিকা থেকে। নিজের জাত, বীজের মান, বীজের মোড়ক ও বর্তমান স্থানীয় পরামর্শ দেখুন। ফলন বা পানি সাশ্রয়ের পূর্বাভাস নয়।',
        )}
      </p>
      <h3>{t('Broadcast seed quantity', 'ছিটিয়ে বোনার বীজের পরিমাণ')}</h3>
      <label>
        {t('Actual variety', 'আসল জাত')}
        <select value={variety} onChange={(e) => setVariety(e.target.value)}>
          <option value="">{t('Choose the variety you have', 'আপনার জাত বাছুন')}</option>
          {mungBroadcastRates.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name} · {r.low}–{r.high} kg/ha
            </option>
          ))}
        </select>
      </label>
      {quantity && (
        <p role="status">
          <strong>
            {quantity.low.toFixed(1)}–{quantity.high.toFixed(1)} kg
          </strong>{' '}
          · {farm.area} ha × {mungBroadcastRates.find((v) => v.id === variety)!.low}–
          {mungBroadcastRates.find((v) => v.id === variety)!.high} kg/ha.{' '}
          {t(
            'For broadcasting only. These rates are not automatically applied to machine or bed sowing.',
            'শুধু ছিটিয়ে বোনার জন্য। যন্ত্র বা বেডে এই হার নিজে থেকে ব্যবহার হয় না।',
          )}
        </p>
      )}
      <h3>{t('Check your seed germination', 'বীজের অঙ্কুরোদগম দেখুন')}</h3>
      <p>
        {t(
          'The guide tests 50 seeds in moist soil and counts healthy seedlings after 5–6 days. Enter your actual count; the guide’s acceptance reference is at least 85%.',
          'নির্দেশিকায় আর্দ্র মাটিতে ৫০টি বীজ দিয়ে ৫–৬ দিন পর সুস্থ চারা গোনা হয়। নিজের গোনা সংখ্যা দিন; নির্দেশিকার গ্রহণযোগ্যতার সীমা অন্তত ৮৫%।',
        )}
      </p>
      <label>
        {t('Healthy seedlings out of 50', '৫০টির মধ্যে সুস্থ চারা')}
        <input
          type="number"
          min="0"
          max="50"
          step="1"
          value={healthy}
          onChange={(e) => setHealthy(e.target.value)}
        />
      </label>
      {healthy !== '' && (
        <p role="status">
          {percent === null
            ? t('Enter a whole number from 0 to 50.', '০ থেকে ৫০ পূর্ণ সংখ্যা দিন।')
            : `${percent.toFixed(0)}% · ${percent >= 85 ? t('Meets the guide’s germination reference.', 'নির্দেশিকার অঙ্কুরোদগমের সীমা পূরণ।') : t('Below the guide’s acceptance reference; obtain better seed before sowing.', 'নির্দেশিকার সীমার নিচে; বোনার আগে ভালো বীজ সংগ্রহ করুন।')}`}
        </p>
      )}
      <p>
        {t(
          'The same guide describes machine line sowing at 30 cm row spacing; it does not make that a universal spacing for every variety or establishment method.',
          'একই নির্দেশিকায় যন্ত্রে সারির দূরত্ব ৩০ সেমি বলা আছে; সব জাত বা পদ্ধতিতে এটিই একমাত্র দূরত্ব নয়।',
        )}
      </p>
      <a href={mungGuide.url} target="_blank" rel="noopener noreferrer">
        CIMMYT / CSISA · 2016 · {t('printed pp.9, 12–15, 20', 'মুদ্রিত পৃ.৯, ১২–১৫, ২০')} · CC BY
        4.0
      </a>
    </details>
  );
}
