'use client';
import { useState } from 'react';
import type { SeasonFarm, MaizeThermalProfile } from '../domain/global-season';
import { cycleStatus, referenceWindow } from '../domain/season-lifecycle';
import {
  thermalMethodSource,
  validThermalProfile,
  type ThermalEstimate,
  type ThermalWeather,
} from '../domain/crop-thermal';
import { seasonStore } from '../lib/season-store';
import { usePlanner } from './planner-provider';

export function CycleStatus({ farm, today }: { farm: SeasonFarm; today: string }) {
  const { t } = usePlanner();
  const status = cycleStatus(farm, today);
  return (
    <>
      {status === 'planned'
        ? t('Waiting for actual planting', 'আসল রোপণের অপেক্ষায়')
        : status === 'completed'
          ? t('Season completed · history retained', 'মৌসুম শেষ · হিসাব রাখা আছে')
          : status === 'harvesting'
            ? t('Harvest underway · still active', 'তোলা চলছে · চাষ চলছে')
            : status === 'perennial'
              ? t('Perennial care continues', 'বহুবর্ষজীবী পরিচর্যা চলছে')
              : status === 'extended'
                ? t('Beyond reference window · still growing', 'উৎসের সময় পেরিয়েছে · চাষ চলছে')
                : t('Growing', 'চাষ চলছে')}
    </>
  );
}
export function SeasonProgress({
  farm,
  today,
  estimate,
  onCheckIn,
}: {
  farm: SeasonFarm;
  today: string;
  estimate: ThermalEstimate;
  onCheckIn: () => void;
}) {
  const { t, language } = usePlanner();
  const window = referenceWindow(farm),
    perennial = farm.selection.planKind === 'perennial-review';
  const status = cycleStatus(farm, today);
  const date = (value: string) =>
    new Intl.DateTimeFormat(language === 'bn' ? 'bn-BD' : 'en-GB', {
      dateStyle: 'medium',
      timeZone: 'UTC',
    }).format(new Date(value + 'T12:00:00Z'));
  return (
    <section
      className="card season-progress"
      aria-label={t('Crop progress and timing', 'ফসলের অগ্রগতি ও সময়')}
    >
      <div className="season-section-heading">
        <h2>{t('Crop progress and timing', 'ফসলের অগ্রগতি ও সময়')}</h2>
        <span className={`season-source-pill ${status === 'extended' ? 'notice-amber' : ''}`}>
          <CycleStatus farm={farm} today={today} />
        </span>
      </div>
      <a className="button secondary" href="#farm-daily-update" onClick={onCheckIn}>
        {t('Update today’s field observations', 'আজকের জমির খবর দিন')}
      </a>
      <dl className="season-progress-facts">
        <div>
          <dt>
            {perennial
              ? t('Reference care review', 'উৎসের পরিচর্যা পর্যালোচনা')
              : t('Original reference window', 'উৎসের মূল সময়সীমা')}
          </dt>
          <dd>
            {date(window.originalEarly)}
            {window.originalEarly !== window.originalLate && <> — {date(window.originalLate)}</>}
          </dd>
        </div>
        <div>
          <dt>{t('Actual planting', 'আসল রোপণ')}</dt>
          <dd>{farm.plantedDate ? date(farm.plantedDate) : t('Not recorded', 'লেখা হয়নি')}</dd>
        </div>
        <div>
          <dt>
            {perennial
              ? t('Planting-based care review', 'রোপণভিত্তিক পরিচর্যা পর্যালোচনা')
              : window.cultivar
                ? t('Named-variety reference from planting', 'রোপণ থেকে নির্দিষ্ট জাতের সময়')
                : t('Reference shifted to actual planting', 'আসল রোপণ অনুযায়ী উৎসের সময়সীমা')}
          </dt>
          <dd>
            {farm.plantedDate ? (
              <>
                {date(window.early)}
                {window.early !== window.late && <> — {date(window.late)}</>}
              </>
            ) : (
              t('Record planting first', 'আগে রোপণ লিখুন')
            )}
          </dd>
        </div>
        {window.cultivar && (
          <div>
            <dt>{t('Named variety · dated source', 'নির্দিষ্ট জাত · পুরোনো উৎস')}</dt>
            <dd>
              <a href={window.cultivar.source} target="_blank" rel="noreferrer">
                {window.cultivar.name} · 2016
              </a>
            </dd>
          </div>
        )}
        {farm.harvestStartedDate && (
          <div>
            <dt>{t('Picking started', 'তোলা শুরু')}</dt>
            <dd>{date(farm.harvestStartedDate)}</dd>
          </div>
        )}
        {farm.harvestedDate && (
          <div>
            <dt>
              {perennial
                ? t('Harvest recorded', 'তোলার হিসাব')
                : t('Actual final harvest', 'আসল শেষ তোলা')}
            </dt>
            <dd>{date(farm.harvestedDate)}</dd>
          </div>
        )}
      </dl>
      <p>
        {t(
          'Reference dates are planning information, not a readiness diagnosis. A crop never finishes just because the counter reaches its reference duration.',
          'উৎসের তারিখ পরিকল্পনার তথ্য, কাটার প্রস্তুতির পরীক্ষা নয়। শুধু দিনের গণনা পূর্ণ হলে ফসলের মৌসুম শেষ হয় না।',
        )}
      </p>
      {!perennial && status === 'extended' && (
        <p className="notice-amber">
          {t(
            'Final harvest is not confirmed. Tracking and field checks continue; no extra days are guessed.',
            'শেষ তোলা নিশ্চিত হয়নি। হিসাব ও জমির যাচাই চলবে; অতিরিক্ত দিন অনুমান করে বসানো হয় না।',
          )}
        </p>
      )}
      {status === 'completed' && (
        <p>
          {t(
            'Growing-season checks stop from the final harvest date. The farm record stays available for review and export.',
            'শেষ তোলার দিন থেকে চাষের যাচাই বন্ধ। দেখা ও নামানোর জন্য জমির হিসাব থাকে।',
          )}
        </p>
      )}
      <div className="season-model-status" role="status">
        <strong>
          {farm.thermalProfile
            ? t('Experimental timing estimate', 'পরীক্ষামূলক সময়ের হিসাব')
            : t('Numerical estimate unavailable', 'সংখ্যাভিত্তিক হিসাব নেই')}
        </strong>
        <p>
          {estimate.status === 'projected'
            ? t(
                `Heat-threshold projection: ${date(estimate.projectedDate!)}. Confirm physical maturity and grain moisture before harvest.`,
                `তাপের সীমা পূরণের পূর্বানুমান: ${date(estimate.projectedDate!)}। কাটার আগে আসল পরিপক্বতা ও দানার আর্দ্রতা যাচাই করুন।`,
              )
            : estimate.status === 'observed-maturity'
              ? t(
                  `Farmer-reported physiological maturity: ${date(estimate.observedDate!)}. Harvest is still a separate event.`,
                  `কৃষকের খবর অনুযায়ী দৈহিক পরিপক্বতা: ${date(estimate.observedDate!)}। তোলা আলাদা ঘটনা।`,
                )
              : estimate.status === 'threshold-reached'
                ? t(
                    'The documented heat target has been reached. Check actual maturity; the model does not automatically finish the season.',
                    'নথির তাপের সীমা পূর্ণ হয়েছে। আসল পরিপক্বতা দেখুন; মডেল নিজে থেকে মৌসুম শেষ করে না।',
                  )
                : estimate.status === 'stage-conflict'
                  ? t(
                      'The heat model and recent field stage disagree. An updated date is unavailable; review the variety, field stage and weather inputs.',
                      'তাপের মডেল ও সাম্প্রতিক জমির পর্যায় মেলেনি। নতুন তারিখ নেই; জাত, পর্যায় ও আবহাওয়ার তথ্য যাচাই করুন।',
                    )
                  : estimate.status === 'forecast-limited'
                    ? t(
                        'Updated date unavailable: the remaining heat target is not reached within the available forecast. No long-range temperatures are invented.',
                        'নতুন তারিখ নেই: পাওয়া পূর্বাভাসের মধ্যে বাকি তাপের সীমা পূর্ণ হয় না। দূরের দিনের তাপমাত্রা বানানো হয় না।',
                      )
                    : estimate.status === 'history-incomplete'
                      ? t(
                          `Updated date unavailable: ${estimate.missingDays} completed day(s) lack usable temperature evidence.`,
                          `নতুন তারিখ নেই: ${estimate.missingDays}টি শেষ হওয়া দিনের ব্যবহারযোগ্য তাপমাত্রা নেই।`,
                        )
                      : estimate.status === 'completed'
                        ? t(
                            'Season completed from the farmer’s final-harvest record.',
                            'কৃষকের শেষ তোলার হিসাব অনুযায়ী মৌসুম শেষ।',
                          )
                        : estimate.status === 'waiting-planting'
                          ? t(
                              'Record actual planting to begin heat accumulation.',
                              'তাপের হিসাব শুরু করতে আসল রোপণ লিখুন।',
                            )
                          : estimate.status === 'unavailable'
                            ? t(
                                'Updated date unavailable: fresh, complete weather evidence is needed.',
                                'নতুন তারিখ নেই: নতুন ও সম্পূর্ণ আবহাওয়ার তথ্য দরকার।',
                              )
                            : t(
                                'No supported variety model is configured. Field observations still update guidance; a new numerical date is not invented.',
                                'জাতের সমর্থিত মডেল ঠিক করা নেই। জমির খবর অনুযায়ী নির্দেশনা বদলায়; সংখ্যার নতুন তারিখ বানানো হয় না।',
                              )}
        </p>
        {estimate.accumulated !== undefined && (
          <p>
            {t('Model heat accumulated', 'মডেলে জমা তাপ')}: {estimate.accumulated.toFixed(1)}{' '}
            °F·days · {t('remaining', 'বাকি')}: {estimate.remaining!.toFixed(1)} °F·days
          </p>
        )}
        {estimate.anchorGdd !== undefined && estimate.anchorGdd > 0 && (
          <p>
            {t(
              'Anchored to the recorded 50%-silking event using the documented stage requirement.',
              'নথির পর্যায়ের তাপের চাহিদা দিয়ে অর্ধেক গাছে রেশম আসার লিখিত ঘটনাকে ভিত্তি করা হয়েছে।',
            )}
          </p>
        )}
      </div>
    </section>
  );
}

export function ThermalModelSettings({
  farm,
  series,
  error,
}: {
  farm: SeasonFarm;
  series: ThermalWeather | null;
  error: string | null;
}) {
  const { t, language } = usePlanner();
  const [variety, setVariety] = useState(farm.thermalProfile?.variety ?? '');
  const [target, setTarget] = useState(String(farm.thermalProfile?.targetGdd ?? ''));
  const [silking, setSilking] = useState(String(farm.thermalProfile?.silkingGdd ?? ''));
  const [sourceUrl, setSourceUrl] = useState(farm.thermalProfile?.sourceUrl ?? '');
  const [sourceNote, setSourceNote] = useState(farm.thermalProfile?.sourceNote ?? '');
  const [confirmed, setConfirmed] = useState(false),
    [message, setMessage] = useState('');
  if (farm.selection.crop !== 'maize') return null;
  return (
    <details className="card season-thermal-settings">
      <summary>
        {t(
          'Experimental grain-corn heat model · documented variety only',
          'পরীক্ষামূলক দানার ভুট্টার তাপের মডেল · নথিভুক্ত জাতের জন্য',
        )}
      </summary>
      <p>
        {t(
          'Optional. Use only the actual grain-corn hybrid’s documented growing-degree-day requirement from planting to black layer, in the 86/50 Fahrenheit method. This does not apply to sweet corn, silage or an unknown variety.',
          'ঐচ্ছিক। আসল দানার ভুট্টার হাইব্রিডের নথিতে বোনা থেকে কালো স্তর পর্যন্ত ৮৬/৫০ ফারেনহাইট পদ্ধতির তাপের চাহিদা থাকলেই ব্যবহার করুন। মিষ্টি ভুট্টা, সাইলেজ বা অজানা জাতে প্রযোজ্য নয়।',
        )}
      </p>
      <p className="notice-amber">
        {t(
          'You supply and verify the document. RITU does not authenticate its contents or claim local calibration. Weather is a regional model estimate; heat alone does not model all stress, disease or harvest moisture.',
          'নথি আপনি দেবেন ও যাচাই করবেন। ঋতু নথির সত্যতা বা স্থানীয় ক্যালিব্রেশন নিশ্চিত করে না। আবহাওয়া আঞ্চলিক মডেলের হিসাব; শুধু তাপ দিয়ে সব চাপ, রোগ বা কাটার আর্দ্রতা বোঝা যায় না।',
        )}
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const profile: MaizeThermalProfile = {
            version: 1,
            crop: 'maize',
            purpose: 'grain',
            origin: 'planting',
            method: 'corn-86-50-f',
            variety: variety.trim(),
            targetGdd: Number(target),
            ...(silking.trim() ? { silkingGdd: Number(silking) } : {}),
            sourceUrl: sourceUrl.trim(),
            sourceNote: sourceNote.trim(),
          };
          if (!confirmed || !validThermalProfile(profile)) {
            setMessage(
              t(
                'Check the document, units, source URL and heat requirements.',
                'নথি, একক, উৎসের লিংক ও তাপের চাহিদা যাচাই করুন।',
              ),
            );
            return;
          }
          try {
            seasonStore.update(farm.id, { thermalProfile: profile });
            setMessage(
              t(
                'Documented inputs saved. Model uncertainty is not calibrated.',
                'নথির তথ্য রাখা হয়েছে। মডেলের অনিশ্চয়তার ক্যালিব্রেশন নেই।',
              ),
            );
          } catch {
            setMessage(t('The model settings could not be saved.', 'মডেলের তথ্য রাখা যায়নি।'));
          }
        }}
      >
        <div className="season-form-grid">
          <label>
            {t('Actual grain-corn hybrid', 'আসল দানার ভুট্টার হাইব্রিড')}
            <input
              aria-label={t('Actual grain-corn hybrid', 'আসল দানার ভুট্টার হাইব্রিড')}
              required
              maxLength={120}
              value={variety}
              onChange={(e) => setVariety(e.target.value)}
            />
          </label>
          <label>
            {t(
              'GDD to black layer · °F·days from planting',
              'বোনা থেকে কালো স্তর পর্যন্ত GDD · °F·days',
            )}
            <input
              aria-label={t('GDD to black layer', 'কালো স্তর পর্যন্ত GDD')}
              type="number"
              min={100}
              max={10000}
              step="any"
              required
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            />
          </label>
          <label>
            {t(
              'GDD to 50% silking · optional, same hybrid/method',
              'অর্ধেক গাছে রেশম আসার GDD · ঐচ্ছিক, একই জাত ও পদ্ধতি',
            )}
            <input
              aria-label={t('GDD to 50% silking', 'অর্ধেক গাছে রেশম আসার GDD')}
              type="number"
              min={1}
              max={9999}
              step="any"
              value={silking}
              onChange={(e) => setSilking(e.target.value)}
            />
          </label>
          <label>
            {t('Document source · HTTPS URL', 'নথির উৎস · HTTPS লিংক')}
            <input
              aria-label={t('Heat requirement document URL', 'তাপের চাহিদার নথির লিংক')}
              type="url"
              required
              maxLength={2000}
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
            />
          </label>
        </div>
        <label>
          {t('Document excerpt and method confirmation', 'নথির অংশ ও পদ্ধতির নিশ্চিতকরণ')}
          <textarea
            aria-label={t(
              'Document excerpt and method confirmation',
              'নথির অংশ ও পদ্ধতির নিশ্চিতকরণ',
            )}
            required
            maxLength={1000}
            rows={2}
            value={sourceNote}
            onChange={(e) => setSourceNote(e.target.value)}
          />
        </label>
        <label className="season-model-consent">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
          />
          {t(
            'The document rates this exact grain hybrid from planting, in 86/50 Fahrenheit degree-days. Any silking value is for 50% of plants.',
            'নথিতে এই হাইব্রিডের বোনা থেকে ৮৬/৫০ ফারেনহাইট ডিগ্রি-ডে দেওয়া আছে। রেশমের সংখ্যা দিলে তা অর্ধেক গাছের জন্য।',
          )}
        </label>
        <button className="button secondary" disabled={!confirmed}>
          {t('Save documented model inputs', 'নথির মডেল তথ্য রাখুন')}
        </button>
        {farm.thermalProfile && (
          <button
            type="button"
            className="text-button"
            onClick={() => {
              seasonStore.update(farm.id, { thermalProfile: null });
              setVariety('');
              setTarget('');
              setSilking('');
              setSourceUrl('');
              setSourceNote('');
              setConfirmed(false);
              setMessage(
                t(
                  'Model removed. Field records are retained.',
                  'মডেল সরানো হয়েছে। জমির হিসাব রাখা আছে।',
                ),
              );
            }}
          >
            {t('Remove model settings', 'মডেলের তথ্য সরান')}
          </button>
        )}
      </form>
      {message && <p role="status">{message}</p>}
      {error && (
        <p className="notice-amber" role="status">
          {language === 'bn' ? 'তাপমাত্রার তথ্য আনা যায়নি। কোনো সংখ্যা বানানো হয়নি।' : error}
        </p>
      )}
      <p>
        {t(
          'Daily heat starts the day after planting. Only completed past days count as model history; today and later days remain forecasts. Date projections stop at the available seven-day forecast.',
          'বোনার পরদিন থেকে তাপ গণনা। শেষ হওয়া দিনগুলোই মডেলের অতীত; আজ ও পরের দিনগুলো পূর্বাভাস। পাওয়া সাত দিনের বাইরে নতুন তারিখ দেওয়া হয় না।',
        )}
      </p>
      <a href={thermalMethodSource} target="_blank" rel="noreferrer">
        {t('Ohio State method and limitations', 'ওহাইও স্টেটের পদ্ধতি ও সীমা')}
      </a>
      {farm.thermalProfile && (
        <p>
          <a href={farm.thermalProfile.sourceUrl} target="_blank" rel="noreferrer">
            {t('Your hybrid document · farmer supplied', 'আপনার হাইব্রিডের নথি · কৃষকের দেওয়া')}
          </a>
        </p>
      )}
      {series && (
        <details>
          <summary>{t('Temperature sources and limits', 'তাপমাত্রার উৎস ও সীমা')}</summary>
          <p>
            {t(
              'Regional model history / reanalysis, not measured field temperatures. Provider daily boundaries use its fixed timezone offset; daylight-saving changes inside a history range may shift boundaries. No cultivar or observation uncertainty interval is claimed.',
              'আঞ্চলিক মডেলের অতীত / পুনর্বিশ্লেষণ, জমিতে মাপা তাপ নয়। উৎসের দিনের সীমানায় নির্দিষ্ট সময়ের অফসেট ব্যবহৃত হয়; ডেলাইট সেভিং বদলালে সীমানা সরতে পারে। জাত বা পর্যবেক্ষণের অনিশ্চয়তার নির্দিষ্ট সীমা দাবি করা হয় না।',
            )}
          </p>
          <ul>
            {series.sources.map((url) => (
              <li key={url}>
                <a href={url} target="_blank" rel="noreferrer">
                  {new URL(url).hostname}
                </a>
              </li>
            ))}
          </ul>
        </details>
      )}
    </details>
  );
}
