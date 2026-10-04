'use client';
import { useRef } from 'react';
import { prefersReducedMotion } from '../lib/motion';
import { usePlanner } from './planner-provider';

/** Original illustration. A companion for navigation, not an agricultural adviser. */
export function FarmGuide({ step }: { step: string }) {
  const { t } = usePlanner();
  const wing = useRef<SVGGElement>(null);
  return (
    <button
      className="farm-guide"
      aria-label={t('Say hello to Mati, the farm guide', 'খামারের সঙ্গী মাটিকে শুভেচ্ছা জানান')}
      onClick={() => {
        if (!prefersReducedMotion())
          wing.current?.animate(
            [
              { rotate: '0deg' },
              { rotate: '-22deg' },
              { rotate: '0deg' },
              { rotate: '-22deg' },
              { rotate: '0deg' },
            ],
            { duration: 800, easing: 'ease-in-out' },
          );
      }}
      title={t('Mati · One step at a time', 'মাটি · একবারে একটি ধাপ')}
    >
      <svg
        key={step}
        viewBox="0 0 100 100"
        role="img"
        aria-label={t('Mati, a duck wearing a straw hat', 'খড়ের টুপি পরা হাঁস মাটি')}
      >
        <ellipse cx="49" cy="92" rx="32" ry="5" fill="#dce5cb" />
        <path
          d="M38 82v10h-13m34-10v10h13"
          fill="none"
          stroke="#b87828"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M24 51C10 55 12 79 34 84c27 6 43-5 42-25L69 43Z"
          fill="#faf5dc"
          stroke="#476346"
          strokeWidth="2"
        />
        <g ref={wing} className="guide-wing">
          <path
            d="M35 60c-15-3-19 11-4 16 13 4 20-6 15-12"
            fill="#e3dfbc"
            stroke="#476346"
            strokeWidth="2"
          />
        </g>
        <circle cx="59" cy="34" r="23" fill="#faf5dc" stroke="#476346" strokeWidth="2" />
        <path
          d="m74 34 19 6-19 7"
          fill="#dfad43"
          stroke="#825c24"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <circle cx="65" cy="31" r="3" fill="#293d2d" />
        <circle cx="66" cy="30" r="1" fill="#fff" />
        <path d="M41 53q13 10 29 0l-8 13-8-7-9 6Z" fill="#426d4b" />
        <path d="M36 19 43 5h29l8 14" fill="#dfbf62" stroke="#825c24" strokeWidth="2" />
        <path
          d="M32 20q25-9 53 0"
          fill="none"
          stroke="#a47c33"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <path d="m43 14 31 0" stroke="#547145" strokeWidth="4" />
      </svg>
      <span aria-hidden="true">{t('Mati', 'মাটি')}</span>
    </button>
  );
}
