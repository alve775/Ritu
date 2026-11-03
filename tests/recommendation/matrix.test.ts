import { it } from 'vitest';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { suggestSeason, requirements } from '../../src/domain/plant-screen';
import { blankFarm } from '../../src/lib/evidence-store';
import { validSeasonState } from '../../src/lib/season-store';
import type { SeasonContext, SeasonFarm } from '../../src/domain/global-season';
import { verifiedCommonNames } from '../../src/data/verified-common-names';
const out = 'research/recommendation-audit-2026-11-03';
const sites = JSON.parse(fs.readFileSync(`${out}/contexts.json`, 'utf8')) as {
  country: string;
  name: string;
  context: SeasonContext;
}[];
const dayMs = 86400000,
  start = '2027-03-01',
  days = 366;
const dateAt = (i: number) => new Date(Date.parse(start) + i * dayMs).toISOString().slice(0, 10);
const source = new Map(requirements.crops.map((c) => [c.id, c]));
type Source = (typeof requirements.crops)[number];
type Choice = {
  id: string;
  start: string;
  min: number;
  max: number;
  temperature: number;
  optimal: boolean;
  rain: boolean | null;
  regional: boolean;
  sourceMin: number;
  sourceMax: number;
};
const profiles = (['unknown', 'loam', 'clay', 'sandy'] as const).flatMap((soil) =>
  (['unknown', 'good', 'poor'] as const).flatMap((drainage) =>
    (['reliable', 'limited', 'rainfed', 'severe', 'unknown'] as const).map((irrigation) => ({
      soil,
      drainage,
      irrigation,
    })),
  ),
);
// This reference does not call the production eligibility, category or climate
// arithmetic helpers. Source fidelity is separately checked against original CSV.
function named(c: Source) {
  return (
    !!verifiedCommonNames[c.id] ||
    c.name.en
      .toLowerCase()
      .replaceAll(c.scientific.toLowerCase(), '')
      .replace(/[\s();·-]/g, '').length > 0
  );
}
function usable(c: Source) {
  return (
    named(c) &&
    c.planKind !== 'unknown' &&
    [c.TMIN, c.TOPMN, c.TOPMX, c.TMAX].every((n) => typeof n === 'number' && Number.isFinite(n)) &&
    c.TMIN! < c.TMAX! &&
    c.TMIN! <= c.TOPMN! &&
    c.TOPMN! <= c.TOPMX! &&
    c.TOPMX! <= c.TMAX! &&
    typeof c.GMIN === 'number' &&
    c.GMIN >= 1 &&
    typeof c.GMAX === 'number' &&
    c.GMAX >= c.GMIN &&
    c.GMAX <= 365
  );
}
function accepts(c: Source, p: (typeof profiles)[number]) {
  const tokens = (a: string, b: string) =>
    (a + ',' + b)
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s && s.toUpperCase() !== 'NA');
  const soils = tokens(c.texture, c.toleratedTexture),
    drains = tokens(c.drainage, c.toleratedDrainage);
  const soil =
    p.soil === 'unknown' ||
    !soils.length ||
    soils.includes('wide') ||
    soils.includes({ loam: 'medium', clay: 'heavy', sandy: 'light' }[p.soil]);
  const drainage =
    p.drainage === 'unknown' ||
    !drains.length ||
    drains.some((s) => s.split(/\s+/)[0] === (p.drainage === 'good' ? 'well' : 'poorly'));
  return soil && drainage;
}
function reference(context: SeasonContext) {
  const origin = Date.UTC(2026, 0, 1),
    n = (Date.UTC(2031, 0, 1) - origin) / dayMs;
  const daily = Float64Array.from(
    { length: n },
    (_, i) => context.normal!.months[new Date(origin + i * dayMs).getUTCMonth()].temperature,
  );
  const sums = new Float64Array(n + 1);
  for (let i = 0; i < n; i++) sums[i + 1] = sums[i] + Math.round(daily[i] * 100);
  const lows = [daily],
    highs = [daily];
  for (let k = 1; 1 << k <= n; k++) {
    const half = 1 << (k - 1),
      lo = new Float64Array(n),
      hi = new Float64Array(n);
    for (let i = 0; i + (1 << k) <= n; i++) {
      lo[i] = Math.min(lows[k - 1][i], lows[k - 1][i + half]);
      hi[i] = Math.max(highs[k - 1][i], highs[k - 1][i + half]);
    }
    lows.push(lo);
    highs.push(hi);
  }
  const within = (a: number, len: number, c: Source) => {
    const k = Math.floor(Math.log2(len)),
      width = 1 << k;
    return (
      Math.min(lows[k][a], lows[k][a + len - width]) >= c.TMIN! &&
      Math.max(highs[k][a], highs[k][a + len - width]) <= c.TMAX!
    );
  };
  const ordinal = (year: number, doy: number) => {
    const d = new Date(Date.UTC(2001, 0, Math.max(1, Math.min(365, Math.round(doy)))));
    return new Date(Date.UTC(year, d.getUTCMonth(), d.getUTCDate())).toISOString().slice(0, 10);
  };
  const calendars = new Map<string, SeasonContext['calendars']>();
  for (const c of context.calendars) calendars.set(c.crop, [...(calendars.get(c.crop) ?? []), c]);
  return (from: string) => {
    const year = Number(from.slice(0, 4)),
      month = Number(from.slice(5, 7)) - 1;
    const starts = Array.from({ length: 12 }, (_, i) =>
      i === 0 ? from : new Date(Date.UTC(year, month + i, 1)).toISOString().slice(0, 10),
    );
    const choices: Choice[] = [];
    for (const c of requirements.crops) {
      if (!usable(c)) continue;
      const known = calendars.get(c.id) ?? [];
      const windows = known.length
        ? known.flatMap((calendar) => {
            const first = calendar.first ?? calendar.planting,
              last = calendar.last ?? calendar.planting;
            const next = [year - 1, year, year + 1]
              .map((y) => ({
                first: ordinal(y, first),
                last: ordinal(y + (last < first ? 1 : 0), last),
              }))
              .filter((w) => w.last >= from)
              .sort((a, b) => a.first.localeCompare(b.first))[0];
            return next ? [{ start: next.first > from ? next.first : from, calendar }] : [];
          })
        : starts.map((s) => ({ start: s, calendar: undefined }));
      let best: Choice | undefined;
      for (const w of windows) {
        const review = c.planKind === 'perennial-review',
          min = Math.round(w.calendar?.duration ?? (review ? 365 : c.GMIN!));
        let max = Math.round(w.calendar?.duration ?? (review ? 365 : c.GMAX!));
        if (min < 1 || max < min || max > 365) continue;
        const a = (Date.parse(w.start) - origin) / dayMs;
        assert(a >= 0 && a + max <= n);
        if (!w.calendar && !review) {
          if (!within(a, min, c)) continue;
          let low = min,
            high = max;
          while (low < high) {
            const middle = Math.ceil((low + high) / 2);
            if (within(a, middle, c)) low = middle;
            else high = middle - 1;
          }
          max = low;
        }
        const mean = (sums[a + max] - sums[a]) / 100 / max;
        if (!w.calendar && (mean < c.TMIN! - 1e-9 || mean > c.TMAX! + 1e-9)) continue;
        const choice = {
          id: c.id,
          start: w.start,
          min,
          max,
          temperature: mean,
          optimal: mean >= c.TOPMN! - 1e-9 && mean <= c.TOPMX! + 1e-9,
          rain:
            c.RMIN !== null && c.RMAX !== null
              ? context.normal!.annualRain >= c.RMIN && context.normal!.annualRain <= c.RMAX
              : null,
          regional: !!w.calendar,
          sourceMin: c.GMIN!,
          sourceMax: c.GMAX!,
        };
        if (
          !best ||
          Number(choice.optimal) > Number(best.optimal) ||
          (choice.optimal === best.optimal &&
            (Number(choice.regional) > Number(best.regional) ||
              (choice.regional === best.regional && choice.start < best.start)))
        )
          best = choice;
      }
      if (best) choices.push(best);
    }
    return choices;
  };
}
const ordered = (a: Choice, b: Choice) =>
  Number(b.optimal) - Number(a.optimal) ||
  Number(b.regional) - Number(a.regional) ||
  a.start.localeCompare(b.start) ||
  a.id.localeCompare(b.id);
for (const site of sites)
  it(`${site.country}: every day of a leap-containing year, all 60 input profiles, complete catalogue`, () => {
    const began = Date.now(),
      oracle = reference(site.context);
    const stats = {
      country: site.country,
      location: site.name,
      dates: days,
      profiles: 60,
      setups: 0,
      returnedOptions: 0,
      storedRecords: 0,
      perPlant: {} as Record<string, number>,
      passed: false,
      elapsedSeconds: 0,
    };
    const checkpoint = () => {
      stats.elapsedSeconds = (Date.now() - began) / 1000;
      fs.writeFileSync(`${out}/matrix-${site.country}.json`, JSON.stringify(stats, null, 2));
    };
    try {
      for (let date = 0; date < days; date++) {
        const from = dateAt(date),
          expected = oracle(from),
          index = new Map(expected.map((c) => [c.id, c]));
        const lists = new Map<string, Choice[]>();
        for (const p of profiles) {
          const key = p.soil + '/' + p.drainage;
          if (!lists.has(key))
            lists.set(key, expected.filter((c) => accepts(source.get(c.id)!, p)).sort(ordered));
          const wanted = lists.get(key)!,
            field = { ...blankFarm, area: 1, ...p },
            actual = suggestSeason(site.context, field, from);
          const label = [site.country, from, p.soil, p.drainage, p.irrigation].join('/');
          assert.equal(actual.length, wanted.length, label + ' membership count');
          for (let i = 0; i < actual.length; i++) {
            const a = actual[i],
              e = index.get(a.crop)!;
            assert.equal(a.crop, wanted[i].id, label + ' rank ' + i);
            assert.equal(a.start, e.start, label + ' next planning date ' + a.crop);
            assert(
              Math.abs(a.temperature - e.temperature) < 1e-8,
              label + ' independent daily temperature ' + a.crop,
            );
            assert.equal(a.optimalTemperature, e.optimal, label + ' preferred-temperature fact');
            assert.equal(a.annualRainFit, e.rain, label + ' annual-rain metadata');
            const perennial = source.get(a.crop)!.planKind === 'perennial-review';
            assert.equal(a.durationMin, perennial ? 365 : e.min, label + ' duration minimum');
            assert.equal(
              a.durationMax,
              perennial ? 365 : e.max,
              label + ' supported planning duration',
            );
            assert.equal(
              a.endEarly,
              new Date(Date.parse(a.start) + a.durationMin * dayMs).toISOString().slice(0, 10),
            );
            assert.equal(
              a.endLate,
              new Date(Date.parse(a.start) + a.durationMax * dayMs).toISOString().slice(0, 10),
            );
            assert(
              a.start >= from && Date.parse(a.start) - Date.parse(from) < 366 * dayMs,
              label + ' bounded future search',
            );
            assert.equal(a.sourceDurationMin, e.sourceMin);
            assert.equal(a.sourceDurationMax, e.sourceMax);
            assert.equal(
              a.checks?.find((c) => c.factor === 'water')?.state,
              'unknown',
              label + ' no fabricated water adequacy',
            );
            assert.equal(
              a.checks?.find((c) => c.factor === 'local')?.state,
              'unknown',
              label + ' no fabricated local validation',
            );
            if (p.soil === 'unknown')
              assert.equal(a.checks?.find((c) => c.factor === 'soil')?.state, 'unknown');
            if (p.drainage === 'unknown')
              assert.equal(a.checks?.find((c) => c.factor === 'drainage')?.state, 'unknown');
            stats.perPlant[a.crop] = (stats.perPlant[a.crop] ?? 0) + 1;
            stats.returnedOptions++;
          }
          if (date % 31 === 0 && actual.length) {
            const selection = actual[0],
              record: SeasonFarm = {
                id: 'audit-only',
                createdAt: '2026-11-03T00:00:00Z',
                field,
                site: site.context.site,
                context: site.context,
                selection,
                plantedDate: '',
                harvestedDate: '',
                notes: 'Synthetic field setup, authentic captured climate.',
                done: [],
                observations: [],
              };
            assert(
              validSeasonState({
                version: 1,
                farms: [record],
                activeId: record.id,
                confirmedKey: null,
              }),
              label + ' storage contract',
            );
            stats.storedRecords++;
          }
          stats.setups++;
        }
        if (date % 61 === 0) {
          checkpoint();
          console.log(
            `${site.country}: ${date + 1}/${days} dates, ${stats.setups} setup evaluations verified.`,
          );
        }
      }
      stats.passed = true;
      checkpoint();
    } catch (e) {
      checkpoint();
      throw e;
    }
  });

it('records reproducible before/after cases without rewriting the historical audits', async () => {
  const { suggestSeason: before } =
    await import('../../research/recommendation-audit-2026-11-03/before-screen');
  const cases = [];
  for (const site of sites) {
    const field = {
      ...blankFarm,
      area: 1,
      soil: 'unknown' as const,
      drainage: 'unknown' as const,
      irrigation: 'reliable' as const,
    };
    for (const drainage of ['unknown', 'good', 'poor'] as const) {
      const f = { ...field, drainage };
      const a = before(site.context, f, '2026-11-03'),
        b = suggestSeason(site.context, f, '2026-11-03');
      cases.push({
        country: site.country,
        drainage,
        before: a.map((s) => s.crop),
        after: b.map((s) => s.crop),
        added: b.filter((s) => !a.some((v) => v.crop === s.crop)).map((s) => s.crop),
        removed: a.filter((s) => !b.some((v) => v.crop === s.crop)).map((s) => s.crop),
      });
    }
  }
  fs.writeFileSync(`${out}/before-after.json`, JSON.stringify(cases, null, 2));
});
