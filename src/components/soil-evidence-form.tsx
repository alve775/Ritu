'use client';
import { useState } from 'react';
import { usePlanner } from './planner-provider';
import { validSoilEvidence, type SoilEvidence } from '../domain/soil-evidence';
import { localToday } from '../domain/global-season';

export function SoilEvidenceForm({
  value,
  onSave,
}: {
  value?: SoilEvidence;
  onSave: (value: SoilEvidence | undefined) => void;
}) {
  const { t } = usePlanner();
  const [ph, setPh] = useState(value ? String(value.ph) : '');
  const [method, setMethod] = useState(value?.method ?? 'other');
  const [depth, setDepth] = useState(value ? String(value.depthCm) : '');
  const [date, setDate] = useState(value?.sampledOn ?? '');
  const [source, setSource] = useState(value?.source ?? '');
  const [message, setMessage] = useState('');
  return (
    <details className="soil-evidence-form source-method">
      <summary>
        {t('Soil test record · optional', 'মাটি পরীক্ষার হিসাব · ঐচ্ছিক')}
        {value ? ' ✓' : ''}
      </summary>
      <p>
        {t(
          'Record a real field/laboratory result. This is your reported evidence, not an authenticated laboratory report. Different pH methods are not interchangeable; this record does not automatically certify crop suitability.',
          'জমি বা পরীক্ষাগারের আসল ফল লিখুন। এটি আপনার দেওয়া তথ্য, পরীক্ষাগারের সত্যতা যাচাই নয়। ভিন্ন pH পদ্ধতি এক নয়; এই হিসাব একা ফসলের উপযুক্ততা নিশ্চিত করে না।',
        )}
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const next = {
            ph: Number(ph),
            method,
            depthCm: Number(depth),
            sampledOn: date,
            source: source.trim(),
          };
          if (!ph.trim() || !depth.trim() || date > localToday() || !validSoilEvidence(next)) {
            setMessage(
              t(
                'Check the pH, sampling depth/date and source.',
                'pH, নমুনার গভীরতা/দিন ও উৎস যাচাই করুন।',
              ),
            );
            return;
          }
          onSave(next);
          setMessage(t('Soil test record saved.', 'মাটি পরীক্ষার হিসাব রাখা হয়েছে।'));
        }}
      >
        <div className="season-form-grid">
          <label>
            {t('Measured soil pH', 'মাপা মাটির pH')}
            <input
              required
              type="number"
              min="0"
              max="14"
              step="any"
              value={ph}
              onChange={(e) => setPh(e.target.value)}
            />
          </label>
          <label>
            {t('pH measurement method', 'pH মাপার পদ্ধতি')}
            <select
              aria-label={t('pH measurement method', 'pH মাপার পদ্ধতি')}
              value={method}
              onChange={(e) => setMethod(e.target.value as SoilEvidence['method'])}
            >
              <option value="water">pH (H₂O)</option>
              <option value="cacl2">pH (CaCl₂)</option>
              <option value="other">{t('Other / method unknown', 'অন্য / পদ্ধতি অজানা')}</option>
            </select>
          </label>
          <label>
            {t('Sample depth (cm)', 'নমুনার গভীরতা (সেমি)')}
            <input
              required
              type="number"
              min="0.01"
              max="1000"
              step="any"
              value={depth}
              onChange={(e) => setDepth(e.target.value)}
            />
          </label>
          <label>
            {t('Soil sampling date', 'মাটির নমুনার দিন')}
            <input
              required
              type="date"
              max={localToday()}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
        </div>
        <label>
          {t(
            'Laboratory / field source and report reference',
            'পরীক্ষাগার / জমির উৎস ও প্রতিবেদনের পরিচয়',
          )}
          <textarea
            aria-label={t(
              'Laboratory / field source and report reference',
              'পরীক্ষাগার / জমির উৎস ও প্রতিবেদনের পরিচয়',
            )}
            required
            maxLength={1000}
            value={source}
            onChange={(e) => setSource(e.target.value)}
          />
        </label>
        <div className="button-row">
          <button className="button secondary" type="submit">
            {t('Save soil test record', 'মাটি পরীক্ষার হিসাব রাখুন')}
          </button>
          {value && (
            <button
              className="button secondary"
              type="button"
              onClick={() => {
                onSave(undefined);
                setMessage(t('Soil test record removed.', 'মাটি পরীক্ষার হিসাব সরানো হয়েছে।'));
              }}
            >
              {t('Clear soil test record', 'মাটি পরীক্ষার হিসাব মুছুন')}
            </button>
          )}
        </div>
        {message && <p role="status">{message}</p>}
      </form>
    </details>
  );
}
