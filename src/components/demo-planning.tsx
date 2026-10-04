'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CircleHelp, MapPin } from 'lucide-react';
import { usePlanner } from './planner-provider';
import { Dialog } from './dialog';
import { demoEnvironment, demoLocations } from '../data/demo-environment';
import type { DemoSettings } from '../data/demo-environment';
import { months } from '../data/preview';
import {
  assessDemo,
  generateDemoPlans,
  farmFingerprint,
  planFingerprint,
} from '../domain/demo-planner';
import type { Irrigation, Priority, Rotation } from '../domain/types';

const weatherLabels = {
  seasonal: { en: 'Seasonal example', bn: 'মৌসুমি নমুনা' },
  dry: { en: 'Drier example', bn: 'শুষ্ক নমুনা' },
  hot: { en: 'Hotter example', bn: 'উষ্ণ নমুনা' },
};
const priorityLabels: Record<Priority, { en: string; bn: string }> = {
  water: { en: 'Lower demo water demand', bn: 'নমুনায় কম পানির চাহিদা' },
  diversity: { en: 'More crop groups', bn: 'বেশি ধরনের ফসল' },
  familiar: { en: 'Familiar crops', bn: 'পরিচিত ফসল' },
  resilience: { en: 'Demo drought resilience', bn: 'নমুনায় খরা সহনশীলতা' },
  soil: { en: 'Pulse inclusion · soil-health proxy', bn: 'ডাল অন্তর্ভুক্তি · মাটির সূচকের নমুনা' },
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
export function DemoEnvironment() {
  const { t, language, demo, setDemo, demoSaved } = usePlanner();
  const disclosure = useHashDisclosure('demo-environment');
  const data = demoEnvironment(demo);
  return (
    <details ref={disclosure} className="disclosure demo-environment" id="demo-environment">
      <summary>
        <MapPin size={20} /> {t('Location & demo environment', 'স্থান ও নমুনার পরিবেশ')}
      </summary>
      <section>
        <div className="demo-section-heading">
          <h2>{t('Start with a location', 'স্থান দিয়ে শুরু করুন')}</h2>
          <Help
            title={t('Demo environment', 'নমুনার পরিবেশ')}
            text={t(
              'Location selects an authored example, not measurements for that place. Rainfall (mm), mean air temperature (°C) and relative wetness (0–1) illustrate the future data contract. No NASA API, observations, forecast, or soil-moisture measurement is used.',
              'স্থান অনুযায়ী হাতে তৈরি নমুনা বাছা হয়; ওই স্থানের পরিমাপ নয়। বৃষ্টি (মিমি), গড় তাপ (°C) ও আপেক্ষিক ভেজাভাব (০–১) ভবিষ্যৎ তথ্যের গঠন দেখায়। কোনো নাসা API, বাস্তব তথ্য বা পূর্বাভাস নেই।',
            )}
          />
        </div>
        <p className="demo-label">
          {t('MOCK DATA · All numbers are fictional', 'নমুনা তথ্য · সব সংখ্যা কাল্পনিক')}
        </p>
        <div className="demo-controls">
          <label>
            {t('Pilot location', 'পাইলট স্থান')}
            <select
              value={demo.location}
              onChange={(e) => setDemo({ location: e.target.value as DemoSettings['location'] })}
            >
              {Object.entries(demoLocations).map(([id, name]) => (
                <option key={id} value={id}>
                  {name[language]}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t('Mock environment', 'কাল্পনিক পরিবেশ')}
            <select
              value={demo.weather}
              onChange={(e) => setDemo({ weather: e.target.value as DemoSettings['weather'] })}
            >
              {Object.entries(weatherLabels).map(([id, name]) => (
                <option key={id} value={id}>
                  {name[language]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <dl className="demo-metrics">
          <div>
            <dt>{t('Example annual rainfall', 'বার্ষিক বৃষ্টির নমুনা')}</dt>
            <dd>{data.reduce((n, m) => n + m.rain, 0)} mm</dd>
          </div>
          <div>
            <dt>{t('Example monthly temperatures', 'মাসিক তাপের নমুনা')}</dt>
            <dd>
              {Math.min(...data.map((m) => m.temperature))}–
              {Math.max(...data.map((m) => m.temperature))} °C
            </dd>
          </div>
          <div>
            <dt>{t('Mean relative wetness', 'গড় আপেক্ষিক ভেজাভাব')}</dt>
            <dd>{(data.reduce((n, m) => n + m.wetness, 0) / 12).toFixed(2)} / 1</dd>
          </div>
        </dl>
        <details className="demo-monthly">
          <summary>{t('Explore the twelve mock months', 'বারো মাসের কাল্পনিক তথ্য দেখুন')}</summary>
          <div
            className="demo-table-scroll"
            tabIndex={0}
            aria-label={t('Mock monthly climate table', 'নমুনার মাসিক জলবায়ুর সারণি')}
          >
            <table>
              <caption>
                {t(
                  'Fictional March–February environment. No observation years or NASA provenance.',
                  'কাল্পনিক মার্চ–ফেব্রুয়ারির পরিবেশ। বাস্তব বছর বা নাসার উৎস নেই।',
                )}
              </caption>
              <thead>
                <tr>
                  <th scope="col">{t('Month', 'মাস')}</th>
                  <th scope="col">{t('Rain · mm', 'বৃষ্টি · মিমি')}</th>
                  <th scope="col">{t('Air · °C', 'তাপ · °C')}</th>
                  <th scope="col">{t('Wetness · 0–1', 'ভেজাভাব · ০–১')}</th>
                </tr>
              </thead>
              <tbody>
                {data.map((m) => (
                  <tr key={m.month}>
                    <th scope="row">{months[language][m.month]}</th>
                    <td>{m.rain}</td>
                    <td>{m.temperature}</td>
                    <td>{m.wetness}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
        <p>
          {t(
            'NASA integration is reserved for later. Wetness is displayed for the demo and is not used to infer crop suitability.',
            'নাসার তথ্য পরে যুক্ত হবে। ভেজাভাব শুধু নমুনায় দেখানো হয়; তা দিয়ে ফসলের উপযোগিতা নির্ধারণ করা হয় না।',
          )}
        </p>
        {!demoSaved && (
          <p role="status">
            {t(
              'Demo settings could not be saved; you can continue in this tab.',
              'নমুনার তথ্য রাখা যায়নি; এই ট্যাবে চালিয়ে যেতে পারেন।',
            )}
          </p>
        )}
      </section>
    </details>
  );
}
export function DemoPlanReasons({ rotation }: { rotation: Rotation }) {
  const { t, language, farm, demo } = usePlanner();
  const result = assessDemo(rotation, farm, demo);
  return (
    <section className="demo-reasons" data-tour="demo-reasons">
      <div className="demo-section-heading">
        <h2>{t('Why this demo plan?', 'এই নমুনা পরিকল্পনা কেন?')}</h2>
        <Help
          title={t('Demo comparison rules', 'নমুনার তুলনার নিয়ম')}
          text={t(
            'All climate, temperature limits, water demand indices, drought categories and texture preferences in this engine are invented. Only windows passing every mock and entered consistency check are generated. Your priority ranks those passing calendars. Water and drought indices range from 1 to 3 and are weighted by fictional months. Pulse inclusion and crop-group counts are descriptive proxies, not predicted soil-health benefits. No option is verified for a real farm.',
            'এই ইঞ্জিনের জলবায়ু, তাপের সীমা, পানির সূচক, খরার ধরন ও মাটির পছন্দ কাল্পনিক। প্রতিটি নমুনার শর্তে মেলা ক্রমই তৈরি হয়। অগ্রাধিকার শুধু মেলা ক্রমের তুলনায় ব্যবহৃত হয়। পানি ও খরার সূচক ১–৩; কাল্পনিক মাস অনুযায়ী গড় করা হয়। ডাল ও ফসলের ধরন মাটির উপকারের পূর্বাভাস নয়।',
          )}
        />
      </div>
      <p className="demo-label">
        {t('DEMO RULES · not farming advice', 'নমুনার নিয়ম · চাষের পরামর্শ নয়')}
      </p>
      <dl className="demo-metrics">
        <div>
          <dt>{t('Demo demand index', 'নমুনার চাহিদা সূচক')}</dt>
          <dd>{result.demand?.toFixed(2) ?? '—'} / 3</dd>
        </div>
        <div>
          <dt>{t('Demo drought sensitivity', 'নমুনার খরা সংবেদনশীলতা')}</dt>
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
          'Lower indices rank earlier only within the fictional model. No water saving, yield or soil improvement is estimated.',
          'কম সূচক শুধু কাল্পনিক মডেলে আগে আসে। পানি সাশ্রয়, ফলন বা মাটির উন্নতির হিসাব নেই।',
        )}
      </p>
      {result.checks.map((check) => (
        <details key={check.id} className="demo-check">
          <summary>
            <strong>{check.label[language]}</strong>
            <span>
              {check.state === 'fit'
                ? t('Fits demo rules', 'নমুনার নিয়মে মেলে')
                : check.state === 'conflict'
                  ? t('Demo conflict', 'নমুনায় সংঘাত')
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
        {t('Try a scenario · before changing your farm', 'খামার বদলানোর আগে পরিস্থিতি দেখুন')}
      </summary>
      <section>
        <div className="demo-section-heading">
          <h2>{t('What if water becomes scarce?', 'পানি কমে গেলে কী হয়?')}</h2>
          <Help
            title={t('Scenario simulator', 'পরিস্থিতির অনুকরণ')}
            text={t(
              'Draft changes recalculate the mock candidates without altering saved farm inputs. Apply explicitly to save. The comparison uses only fictional rules and climate, plus your entered constraints. Conflicting or unknown windows are excluded; Apply is disabled when no complete compatible calendar remains. No real recommendation or predicted outcome is implied.',
              'খামারের তথ্য না বদলে খসড়া দিয়ে নমুনা আবার হিসাব হয়। রাখতে চাইলে প্রয়োগ করুন। তুলনায় কাল্পনিক নিয়ম, পরিবেশ ও আপনার শর্ত ব্যবহার হয়। অজানা বা সংঘাতের সময় বাদ যায়। সম্পূর্ণ মেলা ক্রম না থাকলে প্রয়োগ বন্ধ থাকে। বাস্তব সুপারিশ বা পূর্বাভাস নয়।',
            )}
          />
        </div>
        <p className="demo-label">
          {t('SIMULATED CONDITIONS · not a forecast', 'কাল্পনিক পরিস্থিতি · পূর্বাভাস নয়')}
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
                          `Demo demand ${result.demand?.toFixed(2) ?? 'unknown'}/3 · ${result.conflicts} conflicts · ${result.unknowns} unknowns`,
                          `নমুনার চাহিদা ${result.demand?.toFixed(2) ?? 'অজানা'}/৩ · ${result.conflicts} সংঘাত · ${result.unknowns} অজানা`,
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
                    'শর্ত ও পছন্দে মেলা ক্যালেন্ডার নেই। ফসল বা খামারের শর্ত দেখুন; সংঘাতের ক্রম তৈরি হয় না।',
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
                'শুধু খসড়া। প্রয়োগ না করা পর্যন্ত খামারের তথ্য বদলায়নি।',
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
