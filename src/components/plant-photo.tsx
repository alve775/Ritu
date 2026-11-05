'use client';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { invalidatePlantPhoto, loadPlantPhoto } from '../lib/plant-photo-client';
import type { PlantPhoto as ReferencePhoto } from '../domain/plant-photo';
import type { GlobalCrop } from '../domain/global-season';
import { usePlanner } from './planner-provider';
import { plantDisplayName } from '../domain/plant-names';
export function PlantPhoto({ plant }: { plant: GlobalCrop }) {
  const { t, language } = usePlanner();
  const ref = useRef<HTMLElement>(null);
  const [photo, setPhoto] = useState<ReferencePhoto | null>(null);
  const [status, setStatus] = useState<'loading' | 'unavailable' | 'failed'>('loading');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let started = false;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting) || started) return;
        started = true;
        observer.disconnect();
        setStatus('loading');
        loadPlantPhoto(plant.id)
          .then((result) => {
            if (!controller.signal.aborted) {
              const valid =
                result &&
                result.scientific === plant.scientific &&
                result.provider === 'Wikimedia Commons';
              setPhoto(valid ? result : null);
              setStatus(valid ? 'loading' : 'unavailable');
            }
          })
          .catch(() => {
            if (!controller.signal.aborted) setStatus('failed');
          });
      },
      { rootMargin: '160px' },
    );
    if (ref.current) observer.observe(ref.current);
    return () => {
      controller.abort();
      observer.disconnect();
    };
  }, [plant.id, plant.scientific, attempt]);
  return (
    <figure className="crop-photo compact plant-reference" ref={ref}>
      {photo && status !== 'failed' ? (
        <a href={photo.source} target="_blank" rel="noreferrer">
          <Image
            src={photo.src}
            alt={`${plantDisplayName(plant, language)} · ${t('species reference photo', 'প্রজাতির উদাহরণ ছবি')}`}
            width={500}
            height={375}
            unoptimized
            loading="lazy"
            onError={() => setStatus('failed')}
          />
        </a>
      ) : (
        <div className="plant-photo-status" role="status">
          <strong>{plantDisplayName(plant, language)}</strong>
          <span>
            {status === 'loading'
              ? t('Loading a licensed plant photograph…', 'অনুমোদিত গাছের ছবি আনা হচ্ছে…')
              : status === 'unavailable'
                ? t(
                    'No matching reusable source photo is available.',
                    'যাচাইকৃত উন্মুক্ত লাইসেন্সের ছবি পাওয়া যায়নি।',
                  )
                : t('Photograph unavailable right now.', 'এই মুহূর্তে ছবি আনা যায়নি।')}
          </span>
          {status === 'failed' && (
            <button
              onClick={() => {
                invalidatePlantPhoto(plant.id);
                setPhoto(null);
                setAttempt((a) => a + 1);
              }}
            >
              {t('Retry photo', 'ছবি আবার আনুন')}
            </button>
          )}
        </div>
      )}
      {photo && (
        <figcaption>
          {photo.author} ·{' '}
          <a href={photo.licenseUrl} target="_blank" rel="noreferrer">
            {photo.license}
          </a>{' '}
          ·{' '}
          <a href={photo.source} target="_blank" rel="noreferrer">
            {photo.provider}
          </a>
          {' · '}
          <a href={photo.entity} target="_blank" rel="noreferrer">
            {t('Plant identity', 'গাছের পরিচয়')}
          </a>
          <br />
          {t(
            'API-sourced species reference; cultivar and growth stage may differ.',
            'প্রজাতির উদাহরণ; আপনার জমি বা জাতের নিশ্চয়তা নয়।',
          )}
        </figcaption>
      )}
    </figure>
  );
}
