import { it } from 'vitest';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { suggestSeason, requirements } from '../src/domain/plant-screen';
import { blankFarm } from '../src/lib/evidence-store';
import { validSeasonState } from '../src/lib/season-store';
import { actionsForDay } from '../src/domain/season-actions';
import type { CropSuggestion, SeasonContext, SeasonFarm } from '../src/domain/global-season';
import type { Farm } from '../src/domain/types';
const folder = 'research/global-audit-2026-11-01';
const locations = JSON.parse(fs.readFileSync(`${folder}/world-contexts.json`, 'utf8')) as {
  country: string;
  name: string;
  context: SeasonContext;
}[];
const count = Number(process.env.RITU_AUDIT_DAYS ?? 731),
  start = '2026-11-01',
  DAY = 86400000;
const dateAt = (offset: number) =>
  new Date(Date.parse(start) + offset * DAY).toISOString().slice(0, 10);
const source = new Map(requirements.crops.map((c) => [c.id, c]));
type Crop = (typeof requirements.crops)[number];
type Choice = {
  id: string;
  start: string;
  min: number;
  max: number;
  temperature: number;
  optimal: boolean;
  rain: boolean | null;
  regional: boolean;
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
const fieldSets = new Map<string, Set<string>>();
for (const p of profiles) {
  const key = p.soil + '/' + p.drainage;
  if (fieldSets.has(key)) continue;
  const permitted = new Set<string>();
  for (const c of requirements.crops) {
    const textures = (c.texture + ',' + c.toleratedTexture)
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const desired = { loam: 'medium', clay: 'heavy', sandy: 'light' }[
      p.soil as 'loam' | 'clay' | 'sandy'
    ];
    const soil =
      p.soil === 'unknown' ||
      textures.length === 0 ||
      textures.includes('wide') ||
      textures.includes(desired);
    const drains = c.drainage + ',' + c.toleratedDrainage;
    const incompatible =
      p.drainage === 'poor' &&
      !/poorly/.test(drains) &&
      (/well/.test(drains) || /excessive/.test(drains));
    if (soil && !incompatible) permitted.add(c.id);
  }
  fieldSets.set(key, permitted);
}
function usable(c: Crop) {
  const v = [c.TMIN, c.TOPMN, c.TOPMX, c.TMAX];
  return (
    c.planKind !== 'unknown' &&
    v.every((x) => typeof x === 'number' && Number.isFinite(x)) &&
    c.TMIN! < c.TMAX! &&
    c.TMIN! <= c.TOPMN! &&
    c.TOPMN! <= c.TOPMX! &&
    c.TOPMX! <= c.TMAX! &&
    typeof c.GMIN === 'number' &&
    typeof c.GMAX === 'number' &&
    c.GMIN >= 1 &&
    c.GMAX >= c.GMIN &&
    c.GMAX <= 365
  );
}
/** Independent daily-prefix/sparse-range oracle; production uses month overlaps. */
function oracle(context: SeasonContext) {
  const origin = Date.UTC(2025, 0, 1),
    end = Date.UTC(2032, 0, 1),
    n = (end - origin) / DAY;
  const daily = Float64Array.from(
    { length: n },
    (_, i) => context.normal!.months[new Date(origin + i * DAY).getUTCMonth()].temperature,
  );
  const prefix = new Float64Array(n + 1);
  for (let i = 0; i < n; i++) prefix[i + 1] = prefix[i] + daily[i];
  const lows = [daily],
    highs = [daily];
  for (let k = 1; 1 << k <= n; k++) {
    const width = 1 << (k - 1),
      lo = new Float64Array(n),
      hi = new Float64Array(n);
    for (let i = 0; i + (1 << k) <= n; i++) {
      lo[i] = Math.min(lows[k - 1][i], lows[k - 1][i + width]);
      hi[i] = Math.max(highs[k - 1][i], highs[k - 1][i + width]);
    }
    lows.push(lo);
    highs.push(hi);
  }
  const calendars = new Map<string, SeasonContext['calendars']>();
  for (const c of context.calendars) calendars.set(c.crop, [...(calendars.get(c.crop) ?? []), c]);
  const ordinal = (year: number, doy: number) => {
    const ref = new Date(Date.UTC(2001, 0, Math.max(1, Math.min(365, Math.round(doy)))));
    return new Date(Date.UTC(year, ref.getUTCMonth(), ref.getUTCDate())).toISOString().slice(0, 10);
  };
  return (from: string) => {
    const year = Number(from.slice(0, 4)),
      month = Number(from.slice(5, 7)) - 1;
    const monthly = Array.from({ length: 12 }, (_, i) =>
      i === 0 ? from : new Date(Date.UTC(year, month + i, 1)).toISOString().slice(0, 10),
    );
    const result: Choice[] = [];
    for (const c of requirements.crops) {
      if (!usable(c)) continue;
      const known = calendars.get(c.id) ?? [];
      const windows = known.length
        ? known.flatMap((calendar) => {
            const first = calendar.first ?? calendar.planting,
              last = calendar.last ?? calendar.planting;
            const options = [year - 1, year, year + 1]
              .map((y) => ({
                first: ordinal(y, first),
                last: ordinal(y + (last < first ? 1 : 0), last),
              }))
              .filter((w) => w.last >= from)
              .sort((a, b) => a.first.localeCompare(b.first));
            if (!options.length) return [];
            return [{ date: options[0].first > from ? options[0].first : from, calendar }];
          })
        : monthly.map((date) => ({ date, calendar: undefined }));
      let best: Choice | undefined;
      for (const w of windows) {
        const min = Math.round(w.calendar?.duration ?? c.GMIN!),
          max = Math.round(w.calendar?.duration ?? c.GMAX!);
        if (min < 1 || max < min || max > 365) continue;
        const a = (Date.parse(w.date) - origin) / DAY,
          b = a + max;
        assert(a >= 0 && b <= n, 'Oracle range');
        const mean = (prefix[b] - prefix[a]) / max;
        if (mean < c.TMIN! - 1e-9 || mean > c.TMAX! + 1e-9) continue;
        const k = Math.floor(Math.log2(max)),
          width = 1 << k;
        if (
          !w.calendar &&
          (Math.min(lows[k][a], lows[k][b - width]) < c.TMIN! ||
            Math.max(highs[k][a], highs[k][b - width]) > c.TMAX!)
        )
          continue;
        const choice = {
          id: c.id,
          start: w.date,
          min,
          max,
          temperature: mean,
          optimal: mean >= c.TOPMN! - 1e-9 && mean <= c.TOPMX! + 1e-9,
          rain:
            c.RMIN !== null && c.RMAX !== null
              ? context.normal!.annualRain >= c.RMIN && context.normal!.annualRain <= c.RMAX
              : null,
          regional: !!w.calendar,
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
      if (best) result.push(best);
    }
    return result;
  };
}
const rank = (rain: boolean) => (a: Choice, b: Choice) =>
  Number(b.optimal) - Number(a.optimal) ||
  (rain ? Number(b.rain === true) - Number(a.rain === true) : 0) ||
  Number(b.regional) - Number(a.regional) ||
  a.start.localeCompare(b.start) ||
  a.id.localeCompare(b.id);
for (const location of locations)
  it(`all ${count} dates x 60 land profiles x full catalogue: ${location.country}`, () => {
    const begin = Date.now(),
      calculate = oracle(location.context);
    const summary = {
      country: location.country,
      location: location.name,
      from: start,
      dates: count,
      profilesPerDate: 60,
      setupEvaluations: 0,
      returnedSelectionsChecked: 0,
      storageRecordsChecked: 0,
      distinctPlants: [] as string[],
      perPlant: {} as Record<string, { profiles: number; first: string; last: string }>,
      elapsedSeconds: 0,
      passed: false,
    };
    const checkedRecords = new Set<string>(),
      found = new Set<string>();
    const checkpoint = () => {
      summary.distinctPlants = [...found].sort();
      summary.elapsedSeconds = (Date.now() - begin) / 1000;
      fs.writeFileSync(
        `${folder}/matrix-${location.country}${count === 731 ? '' : '-probe'}.json`,
        JSON.stringify(summary, null, 2),
      );
    };
    for (let day = 0; day < count; day++) {
      const from = dateAt(day),
        expected = calculate(from),
        index = new Map(expected.map((c) => [c.id, c]));
      const standard = expected.slice().sort(rank(false)),
        water = expected.slice().sort(rank(true));
      const expectedLists = new Map<string, string[]>();
      for (const p of profiles) {
        const scarce = ['limited', 'rainfed', 'severe'].includes(p.irrigation),
          fieldKey = p.soil + '/' + p.drainage,
          key = fieldKey + '/' + scarce;
        if (!expectedLists.has(key))
          expectedLists.set(
            key,
            (scarce ? water : standard)
              .filter((c) => fieldSets.get(fieldKey)!.has(c.id))
              .map((c) => c.id),
          );
        const wanted = expectedLists.get(key)!,
          field = { ...blankFarm, area: 1, name: 'QA input, not a surveyed farm', ...p };
        const actual = suggestSeason(location.context, field, from);
        const label = `${location.country}/${from}/${p.soil}/${p.drainage}/${p.irrigation}`;
        assert.equal(actual.length, wanted.length, label + ' count');
        for (let i = 0; i < actual.length; i++) {
          const choice = actual[i],
            c = source.get(choice.crop)!,
            reference = index.get(choice.crop)!;
          assert.equal(choice.crop, wanted[i], label + ' ordering/eligibility');
          assert.equal(choice.start, reference.start, label + ' next window ' + choice.crop);
          assert(
            Math.abs(choice.temperature - reference.temperature) < 1e-7,
            label + ' independent daily mean ' + choice.crop,
          );
          assert.equal(choice.optimalTemperature, reference.optimal, label + ' preferred range');
          assert.equal(choice.annualRainFit, reference.rain, label + ' rainfall provenance');
          assert.equal(choice.durationMin, c.planKind === 'perennial-review' ? 365 : reference.min);
          assert.equal(choice.durationMax, c.planKind === 'perennial-review' ? 365 : reference.max);
          assert.equal(
            choice.endEarly,
            new Date(Date.parse(choice.start) + choice.durationMin * DAY)
              .toISOString()
              .slice(0, 10),
          );
          assert.equal(
            choice.endLate,
            new Date(Date.parse(choice.start) + choice.durationMax * DAY)
              .toISOString()
              .slice(0, 10),
          );
          assert(choice.start >= from, label + ' cannot start in the past');
          assert(
            choice.reasons.length >= 2 && choice.cautions.length >= 1,
            label + ' evidence and caveats',
          );
          assert.equal(
            choice.cautions.some((t) => t === 'Soil texture has not been confirmed.'),
            p.soil === 'unknown',
          );
          assert.equal(
            choice.cautions.some((t) => t === 'Check drainage before planting.'),
            p.drainage === 'unknown',
          );
          assert.equal(
            choice.cautions.some((t) => t === 'Water availability has not been confirmed.'),
            p.irrigation === 'unknown',
          );
          found.add(choice.crop);
          const stat = summary.perPlant[choice.crop] ?? { profiles: 0, first: from, last: from };
          stat.profiles++;
          stat.last = from;
          summary.perPlant[choice.crop] = stat;
          // Each crop/month/profile is also checked as a persisted farm and a daily
          // checklist. The exhaustive date matrix above still checks every output.
          const recordKey =
            choice.crop +
            '/' +
            from.slice(0, 7) +
            '/' +
            p.soil +
            '/' +
            p.drainage +
            '/' +
            p.irrigation;
          if (!checkedRecords.has(recordKey) && day % 28 === 0) {
            checkedRecords.add(recordKey);
            validateFarm(location.context, field, choice, label);
            summary.storageRecordsChecked++;
          }
          summary.returnedSelectionsChecked++;
        }
        summary.setupEvaluations++;
      }
      if (day % 31 === 0) {
        checkpoint();
        console.log(
          `${location.country}: ${day + 1}/${count} dates, ${summary.setupEvaluations} setups verified.`,
        );
      }
    }
    summary.passed = true;
    checkpoint();
  });
function validateFarm(
  context: SeasonContext,
  field: Farm,
  selection: CropSuggestion,
  label: string,
) {
  const record: SeasonFarm = {
    id: 'audit-record',
    createdAt: '2026-11-01T00:00:00Z',
    field,
    site: context.site,
    context,
    selection,
    plantedDate: '',
    harvestedDate: '',
    notes: '',
    done: [],
    observations: [],
  };
  assert(
    validSeasonState({ version: 1, farms: [record], activeId: record.id, confirmedKey: null }),
    label + ' saved record',
  );
  assert(
    actionsForDay(record, selection.start, null).some((a) => a.id === 'record-planting'),
    label + ' no invented planting',
  );
  const planted = { ...record, plantedDate: '2026-01-01' };
  assert(
    actionsForDay(planted, '2026-01-01', null).some((a) => a.id === 'walk-field'),
    label + ' actual planting',
  );
  if (selection.planKind === 'perennial-review')
    assert(
      !actionsForDay({ ...planted, harvestedDate: '2026-10-01' }, '2027-12-01', null).some(
        (a) => a.id === 'maturity-check' || a.id === 'post-harvest',
      ),
      label + ' perennial harvest is not end of planting',
    );
}
