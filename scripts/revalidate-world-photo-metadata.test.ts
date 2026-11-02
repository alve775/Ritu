/** Reapply tightened subject rules to saved original API metadata, without network traffic. */
import { it, expect } from 'vitest';
import fs from 'node:fs';
import {
  parseCommonsPhoto,
  type CommonsImageInfo,
  type PlantPhoto,
} from '../src/domain/plant-photo';

it('revalidates every accepted file against the final subject policy using its original metadata', () => {
  const folder = 'research/global-audit-2026-11-01';
  const file = `${folder}/image-subject-review.json`;
  const original = fs.readFileSync(file, 'utf8');
  const backup = `${folder}/image-subject-review-before-language-guard.json`;
  if (!fs.existsSync(backup)) fs.writeFileSync(backup, original);
  const report = JSON.parse(original);
  let checked = 0,
    rejected = 0;
  for (const row of report.results as {
    status: string;
    photo?: PlantPhoto;
    info?: CommonsImageInfo;
    checkedAt: string;
    metadataFetchedAt?: string;
    validationSource?: string;
  }[]) {
    if (row.status !== 'available') continue;
    expect(row.info, 'Original metadata must exist before revalidation').toBeTruthy();
    const photo = row.photo!;
    const accepted = parseCommonsPhoto(
      row.info!,
      photo.title,
      photo.scientific,
      photo.matchedScientific,
      photo.entity.split('/').at(-1)!,
    );
    row.metadataFetchedAt ??= row.checkedAt;
    row.checkedAt = new Date().toISOString();
    row.validationSource = 'Saved original Commons API metadata; no new network response';
    checked++;
    if (!accepted) {
      row.status = 'source-unavailable';
      rejected++;
    }
  }
  report.finalSubjectValidation = {
    at: new Date().toISOString(),
    checked,
    rejected,
    method: 'Production parser against retained original API metadata',
  };
  fs.writeFileSync(file, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report.finalSubjectValidation));
});
