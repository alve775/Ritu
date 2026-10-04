'use client';
import { useLayoutEffect, useRef } from 'react';
import { prefersReducedMotion } from '../lib/motion';

export function StreamText({
  text,
  reveal,
  instant = false,
}: {
  text: string;
  reveal: boolean;
  instant?: boolean;
}) {
  const root = useRef<HTMLSpanElement>(null);
  // Word segmentation leaves Bangla grapheme clusters intact. Whitespace is preserved.
  const words =
    typeof Intl.Segmenter === 'function'
      ? Array.from(
          new Intl.Segmenter(undefined, { granularity: 'word' }).segment(text),
          (part) => part.segment,
        )
      : (text.match(/\s+|\S+/gu) ?? [text]);
  useLayoutEffect(() => {
    const elements = Array.from(root.current?.querySelectorAll<HTMLElement>('.stream-word') ?? []);
    if (!reveal && !instant && !prefersReducedMotion()) {
      elements.forEach((element) => {
        element.style.opacity = '0';
      });
      return;
    }
    elements.forEach((element) => {
      element.style.opacity = '1';
    });
    if (instant || prefersReducedMotion()) return;
    const animations = elements.map((element, index) =>
      element.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: 180,
        delay: index * Math.min(18, 650 / Math.max(1, elements.length - 1)),
        fill: 'backwards',
        easing: 'ease-out',
      }),
    );
    const settle = () => {
      if (prefersReducedMotion()) animations.forEach((animation) => animation.finish());
    };
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    preference.addEventListener('change', settle);
    document.addEventListener('ritu-motion-change', settle);
    return () => {
      animations.forEach((animation) => animation.cancel());
      preference.removeEventListener('change', settle);
      document.removeEventListener('ritu-motion-change', settle);
    };
  }, [text, reveal, instant]);
  return (
    <span className="stream-text" ref={root}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {words.map((word, index) => (
          <span className="stream-word" key={index}>
            {word}
          </span>
        ))}
      </span>
    </span>
  );
}
