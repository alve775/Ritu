'use client';
import Image from 'next/image';
import { useState } from 'react';
import photos from '../data/crop-photos.json';
import type { CropId } from '../domain/types';
import { crops } from '../data/crops';
import { usePlanner } from './planner-provider';

export function photoFor(crop: CropId): (typeof photos)[keyof typeof photos] | undefined {
  const key = ['boro', 'aman', 'aus'].includes(crop) ? 'rice' : crop;
  return photos[key as keyof typeof photos];
}
export function CropPhoto({ crop, compact = false }: { crop: CropId; compact?: boolean }) {
  const photo = photoFor(crop);
  if (!photo) return null;
  return <Photo key={photo.src} crop={crop} compact={compact} />;
}
function Photo({ crop, compact }: { crop: CropId; compact: boolean }) {
  const { t, language } = usePlanner();
  const photo = photoFor(crop)!;
  const [failed, setFailed] = useState(false);
  return (
    <figure className={`crop-photo ${compact ? 'compact' : ''}`}>
      {failed ? (
        <p role="status">
          {t(
            'Crop photograph could not load. The crop name and calendar remain available.',
            'ফসলের ছবি আনা যায়নি। ফসলের নাম ও ক্যালেন্ডার দেখা যাবে।',
          )}
        </p>
      ) : (
        <a
          href={photo.source}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${t('Open original crop photograph', 'ফসলের মূল ছবি খুলুন')}: ${crops[crop].name[language]}`}
        >
          <Image
            src={photo.src}
            alt={`${crops[crop].name[language]} · ${t('reference photograph', 'উদাহরণ ছবি')}`}
            width={800}
            height={600}
            unoptimized
            onError={() => setFailed(true)}
          />
        </a>
      )}
      <figcaption>
        {crop === 'mung' && (
          <strong>
            {t('Mung bean seeds · harvested crop reference', 'মুগের বীজ · কাটা ফসলের উদাহরণ')}
            <br />
          </strong>
        )}
        <span>
          {t('Photo', 'ছবি')}: {photo.author} ·{' '}
          <a href={photo.licenseUrl} target="_blank" rel="noopener noreferrer">
            {photo.license}
          </a>{' '}
          ·{' '}
          <a href={photo.source} target="_blank" rel="noopener noreferrer">
            {t('Source', 'উৎস')}
          </a>
        </span>
        {!compact && (
          <p>
            {t(
              'Reference example, not your field or a growth forecast. Appearance varies with variety and growth stage; rice photos represent the species rather than a verified Boro, Aman or Aus cultivar.',
              'এটি উদাহরণ, আপনার জমি বা বৃদ্ধির পূর্বাভাস নয়। জাত ও বয়সভেদে চেহারা বদলায়; ধানের ছবি প্রজাতি বোঝায়, যাচাইকৃত বোরো, আমন বা আউশের জাত নয়।',
            )}
          </p>
        )}
      </figcaption>
    </figure>
  );
}
