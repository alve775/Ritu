'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CircleHelp } from 'lucide-react';
import { usePlanner } from './legacy-planner-provider';
import { Dialog } from './dialog';
import { climateFor, demoEnvironment } from '../data/demo-environment';
import type { DemoSettings } from '../data/demo-environment';
import { months, previewData } from '../data/preview';
import {
  assessDemo,
  generateDemoPlans,
  farmFingerprint,
  planFingerprint,
} from '../domain/demo-planner';
import type { Irrigation, Priority, Rotation } from '../domain/types';

const weatherLabels = {
  seasonal: { en: 'Historical NASA year', bn: 'নাসার ইতিহাসের বছর' },
  dry: { en: 'What if: 55% less rain', bn: 'ধরুন: ৫৫% কম বৃষ্টি' },
  hot: { en: 'What if: +5 °C', bn: 'ধরুন: ৫ °C বেশি' },
};
const priorityLabels: Record<Priority, { en: string; bn: string }> = {
  water: { en: 'Lower water demand', bn: 'কম পানির চাহিদা' },
  diversity: { en: 'More crop groups', bn: 'বেশি ধরনের ফসল' },
  familiar: { en: 'Familiar crops', bn: 'পরিচিত ফসল' },
  resilience: { en: 'Drought resilience', bn: 'খরা সহনশীলতা' },
  soil: { en: 'Pulse inclusion · soil-health proxy', bn: 'ডাল অন্তর্ভুক্তি · মাটির সূচক' },
};
const irrigationLabels: Record<Irrigation, { en: string; bn: string }> = {
  reliable: { en: 'Reliable irrigation', bn: 'নিয়মিত সেচ' },
  limited: { en: 'Limited irrigation', bn: 'সীমিত সেচ' },
  severe: { en: 'Severe shortage', bn: 'তীব্র পানির সংকট' },
  rainfed: { en: 'Rainfall only', bn: 'শুধু বৃষ্টি' },
  unknown: { en: 'Not sure', bn: 'জানা নেই' },
};
function useHashDisclosure(id: string) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const reveal = () => {
      if (window.location.hash === `#${id}` && ref.current) ref.current.open = true;
    };
    reveal();
    window.addEventListener('hashchange', reveal);
    return () => window.removeEventListener('hashchange', reveal);
  }, [id]);
  return ref;
}
function Help({ title, text }: { title: string; text: string }) {
  const [open, setOpen] = useState(false);
  const { t } = usePlanner();
  return (
    <>
      <button
        className="icon-button"
        aria-label={`${t('Help', 'সহায়তা')}: ${title}`}
        onClick={() => setOpen(true)}
      >
        <CircleHelp size={22} />
      </button>
      {open && (
        <Dialog title={title} onClose={() => setOpen(false)}>
          <p>{text}</p>
        </Dialog>
      )}
    </>
  );
}
export function DemoPlanReasons({ rotation }: { rotation: Rotation }) {
  const { t, language, farm, demo } = usePlanner();
  const result = assessDemo(rotation, farm, demo);
  const climate = climateFor(demo);
  const environment = demoEnvironment(demo);
  return (
    <section className="demo-reasons" data-tour="demo-reasons">
      <div className="demo-section-heading">
        <h2>{t('Why this plan?', 'এই পরিকল্পনা কেন?')}</h2>
        <Help
          title={t('Comparison rules', 'তুলনার নিয়ম')}
          text={t(
            'Only windows passing every rule and entered consistency check are generated. Your priority ranks those passing calendars. Water and drought indices range from 1 to 3 and are weighted by month. Pulse inclusion and crop-group counts are descriptive proxies, not predicted soil-health benefits. No option is verified for a real farm.',
            'প্রতিটি শর্তে মেলা ক্রমই তৈরি হয়। অগ্রাধিকার শুধু মেলা ক্রমের তুলনায় ব্যবহৃত হয়। পানি ও খরার সূচক ১–৩; মাস অনুযায়ী গড় করা হয়। ডাল ও ফসলের ধরন মাটির উপকারের পূর্বাভাস নয়।',
          )}
        />
      </div>
      <p className="demo-label">
        {t(
          'NASA HISTORY + EXPERIMENTAL RULES · local review required',
          'নাসার ইতিহাস + পরীক্ষামূলক নিয়ম · স্থানীয় যাচাই দরকার',
        )}
      </p>
      <p>
        {t(
          `NASA POWER ${climate.year} · ${climate.latitude.toFixed(2)}° N, ${climate.longitude.toFixed(2)}° E. These historical conditions feed the comparison below.`,
          `নাসা POWER ${climate.year} · ${climate.latitude.toFixed(2)}° উত্তর, ${climate.longitude.toFixed(2)}° পূর্ব। নিচের তুলনায় এই ইতিহাস ব্যবহৃত।`,
        )}
      </p>
      <div className="climate-plan-evidence">
        {rotation.periods
          .filter((p) => p.crop !== 'fallow')
          .map((p, i) => {
            const values = Array.from(
              { length: p.duration },
              (_, n) => environment[(p.start + n) % 12],
            );
            return (
              <section key={i}>
                <h3>{previewData.crops[p.crop].name[language]}</h3>
                <p>
                  {months[language][p.start]}–{months[language][(p.start + p.duration - 1) % 12]} ·{' '}
                  {demo.weather === 'seasonal'
                    ? t('historical rain', 'অতীতের বৃষ্টি')
                    : t('scenario rain', 'কাল্পনিক বৃষ্টি')}
                  : {values.reduce((sum, m) => sum + m.rain, 0).toFixed(1)} mm ·{' '}
                  {demo.weather === 'seasonal'
                    ? t('mean monthly temperature', 'মাসিক তাপের গড়')
                    : t('scenario mean temperature', 'কাল্পনিক গড় তাপ')}
                  : {(values.reduce((sum, m) => sum + m.temperature, 0) / values.length).toFixed(1)}{' '}
                  °C
                </p>
              </section>
            );
          })}
      </div>
      {demo.weather !== 'seasonal' && (
        <p className="notice">
          {t(
            'The figures above include the explicitly selected hypothetical rainfall/temperature scenario. They are not unchanged NASA observations.',
            'ওপরের হিসাবে বাছা কাল্পনিক বৃষ্টি/তাপের পরিবর্তন আছে। এগুলো নাসার অপরিবর্তিত পর্যবেক্ষণ নয়।',
          )}
        </p>
      )}
      <p>
        {t(
          'March–February uses the corresponding months of this one historical year, including January/February of that same year. This is seasonal context, not a continuous next-year forecast. Crop thresholds, water credits and dates are experimental assumptions, not NASA recommendations.',
          'মার্চ–ফেব্রুয়ারিতে একই ইতিহাসের বছরের মাস ব্যবহৃত, জানুয়ারি/ফেব্রুয়ারিও সেই বছরের। এটি পরের বছরের পূর্বাভাস নয়। ফসলের সীমা, পানির ছাড় ও সময় পরীক্ষামূলক ধারণা; নাসার পরামর্শ নয়।',
        )}
      </p>
      <dl className="demo-metrics">
        <div>
          <dt>{t('Demand index', 'চাহিদা সূচক')}</dt>
          <dd>{result.demand?.toFixed(2) ?? '—'} / 3</dd>
        </div>
        <div>
          <dt>{t('Drought sensitivity', 'খরা সংবেদনশীলতা')}</dt>
          <dd>{result.drought?.toFixed(2) ?? '—'} / 3</dd>
        </div>
        <div>
          <dt>{t('Crop groups / pulse months', 'ফসলের ধরন / ডালের মাস')}</dt>
          <dd>
            {result.groups} / {result.pulseMonths}
          </dd>
        </div>
      </dl>
      <p>
        {t(
          'Lower indices rank earlier only within the model. No water saving, yield or soil improvement is estimated.',
          'কম সূচক শুধু মডেলে আগে আসে। পানি সাশ্রয়, ফলন বা মাটির উন্নতির হিসাব নেই।',
        )}
      </p>
      {result.checks.map((check) => (
        <details key={check.id} className="demo-check">
          <summary>
            <strong>{check.label[language]}</strong>
            <span>
              {check.state === 'fit'
                ? t('Fits the rules', 'নিয়মে মেলে')
                : check.state === 'conflict'
                  ? t('Conflict', 'সংঘাত')
                  : t('Unknown', 'অজানা')}
            </span>
          </summary>
          <p>{check.detail[language]}</p>
        </details>
      ))}
    </section>
  );
}
export function ScenarioSimulator() {
  const { t, language, farm, setFarm, priority, setPriority, demo, setDemo, setJourney, select } =
    usePlanner();
  const [draft, setDraft] = useState<{
    irrigation: Irrigation;
    priority: Priority;
    weather: DemoSettings['weather'];
  } | null>(null);
  const scenario = draft ?? { irrigation: farm.irrigation, priority, weather: demo.weather };
  const change = (update: Partial<typeof scenario>) => setDraft({ ...scenario, ...update });
  const disclosure = useHashDisclosure('scenario-simulator');
  const scenarioFarm = useMemo(
    () => ({ ...farm, irrigation: scenario.irrigation }),
    [farm, scenario.irrigation],
  );
  const scenarioDemo = useMemo(
    () => ({ ...demo, weather: scenario.weather }),
    [demo, scenario.weather],
  );
  const baseline = useMemo(() => generateDemoPlans(farm, demo, priority), [farm, demo, priority]);
  const future = useMemo(
    () => generateDemoPlans(scenarioFarm, scenarioDemo, scenario.priority),
    [scenarioFarm, scenarioDemo, scenario.priority],
  );
  const changed =
    scenario.irrigation !== farm.irrigation ||
    scenario.priority !== priority ||
    scenario.weather !== demo.weather;
  return (
    <details ref={disclosure} className="disclosure demo-simulator" id="scenario-simulator">
      <summary>
        {t('Try a scenario · before changing your farm', 'জমির তথ্য বদলানোর আগে পরিস্থিতি দেখুন')}
      </summary>
      <section>
        <div className="demo-section-heading">
          <h2>{t('What if water becomes scarce?', 'পানি কমে গেলে কী হয়?')}</h2>
          <Help
            title={t('Scenario simulator', 'পরিস্থিতির অনুকরণ')}
            text={t(
              'Draft changes recalculate the candidates without altering saved farm inputs. Apply explicitly to save. The comparison uses only this planner’s rules and climate, plus your entered constraints. Conflicting or unknown windows are excluded; Apply is disabled when no complete compatible calendar remains. No real recommendation or predicted outcome is implied.',
              'জমির তথ্য না বদলে খসড়া দিয়ে বিকল্প আবার হিসাব হয়। রাখতে চাইলে প্রয়োগ করুন। তুলনায় নিয়ম, পরিবেশ ও আপনার শর্ত ব্যবহার হয়। অজানা বা সংঘাতের সময় বাদ যায়। সম্পূর্ণ মেলা ক্রম না থাকলে প্রয়োগ বন্ধ থাকে। বাস্তব সুপারিশ বা পূর্বাভাস নয়।',
            )}
          />
        </div>
        <p className="demo-label">
          {t('CONDITIONS · not a forecast', 'পরিস্থিতি · পূর্বাভাস নয়')}
        </p>
        <div className="demo-controls">
          <label>
            {t('Scenario irrigation', 'পরিস্থিতির সেচ')}
            <select
              value={scenario.irrigation}
              onChange={(e) => change({ irrigation: e.target.value as Irrigation })}
            >
              {Object.entries(irrigationLabels).map(([id, name]) => (
                <option key={id} value={id}>
                  {name[language]}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t('Scenario priority', 'পরিস্থিতির অগ্রাধিকার')}
            <select
              value={scenario.priority}
              onChange={(e) => change({ priority: e.target.value as Priority })}
            >
              {Object.entries(priorityLabels).map(([id, name]) => (
                <option key={id} value={id}>
                  {name[language]}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t('Scenario climate', 'পরিস্থিতির জলবায়ু')}
            <select
              value={scenario.weather}
              onChange={(e) => change({ weather: e.target.value as DemoSettings['weather'] })}
            >
              {Object.entries(weatherLabels).map(([id, name]) => (
                <option key={id} value={id}>
                  {name[language]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="scenario-comparison" aria-live="polite" aria-atomic="true">
          {[
            {
              title: t('Saved setup', 'রাখা তথ্য'),
              plans: baseline,
              conditions: farm,
              settings: demo,
            },
            {
              title: t('Scenario draft', 'পরিস্থিতির খসড়া'),
              plans: future,
              conditions: scenarioFarm,
              settings: scenarioDemo,
            },
          ].map((column) => (
            <section key={column.title}>
              <h3>{column.title}</h3>
              <ol>
                {column.plans.map((plan) => {
                  const result = assessDemo(plan, column.conditions, column.settings);
                  return (
                    <li key={plan.id}>
                      <strong>{plan.subtitle[language]}</strong>
                      <p>
                        {t(
                          `Demand ${result.demand?.toFixed(2) ?? 'unknown'}/3 · ${result.conflicts} conflicts · ${result.unknowns} unknowns`,
                          `চাহিদা ${result.demand?.toFixed(2) ?? 'অজানা'}/৩ · ${result.conflicts} সংঘাত · ${result.unknowns} অজানা`,
                        )}
                      </p>
                    </li>
                  );
                })}
              </ol>
              {!column.plans.length && (
                <p>
                  {t(
                    'No compatible calendar for these conditions and choices. Review crops or farm constraints; no conflicting plan is forced.',
                    'শর্ত ও পছন্দে মেলা ক্যালেন্ডার নেই। ফসল বা জমির শর্ত দেখুন; সংঘাতের ক্রম তৈরি হয় না।',
                  )}
                </p>
              )}
            </section>
          ))}
        </div>
        <p role="status">
          {changed
            ? t(
                'Draft only. Your saved farm is unchanged until Apply scenario.',
                'শুধু খসড়া। প্রয়োগ না করা পর্যন্ত জমির তথ্য বদলায়নি।',
              )
            : t(
                'Both columns currently use the same inputs. A change can reorder plans or reveal conflicts; it does not guarantee a different top plan.',
                'দুই পাশে একই তথ্য আছে। বদলালে ক্রম বা সংঘাত বদলাতে পারে; প্রথম পরিকল্পনা সব সময় বদলাবে না।',
              )}
        </p>
        <div className="button-row">
          <button
            className="button primary"
            disabled={!changed || !future.length}
            onClick={() => {
              if (!future.length) return;
              setFarm({ irrigation: scenario.irrigation });
              setPriority(scenario.priority);
              setDemo({ weather: scenario.weather, enabled: true });
              setJourney({
                reviewed: farmFingerprint(scenarioFarm, scenarioDemo, scenario.priority),
                generatedFor: planFingerprint(scenarioFarm, scenarioDemo, scenario.priority),
              });
              select(future[0].id);
              setDraft(null);
            }}
          >
            {t('Apply scenario', 'পরিস্থিতি প্রয়োগ করুন')}
          </button>
          <button className="button secondary" disabled={!draft} onClick={() => setDraft(null)}>
            {t('Reset scenario draft', 'খসড়া রিসেট করুন')}
          </button>
        </div>
      </section>
    </details>
  );
}
