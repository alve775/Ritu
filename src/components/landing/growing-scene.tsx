'use client';
import { useEffect, useRef, useState } from 'react';
import { Pause, Play, RotateCcw, Hand, Droplets, Sprout, Wheat } from 'lucide-react';
import type { Language } from '../../domain/types';
import { FarmIllustration } from './farm-illustration';
import { farmChapters, farmStoryDuration, farmStoryFrame } from './farm-story';
export function GrowingScene({ language }: { language: Language }) {
  const bn = language === 'bn',
    host = useRef<HTMLDivElement>(null),
    svg = useRef<SVGSVGElement>(null);
  const [paused, setPaused] = useState(false),
    [stage, setStage] = useState(0),
    [motionBlocked, setMotionBlocked] = useState(false);
  const running = useRef(false);
  const activeChapter = useRef(0);
  useEffect(() => {
    const node = host.current,
      illustration = svg.current;
    if (!node || !illustration) return;
    const fit = () => {
      const { width, height } = node.getBoundingClientRect();
      if (width && height) {
        const viewWidth = (800 * width) / height;
        const left = (960 - viewWidth) / 2,
          right = left + viewWidth,
          house = Math.min(661, right - 300);
        illustration.setAttribute('viewBox', `${left} 0 ${viewWidth} 800`);
        illustration
          .querySelector('[data-frame="house"]')
          ?.setAttribute('transform', `translate(${house} 189)`);
        illustration
          .querySelector('[data-frame="hay"]')
          ?.setAttribute('transform', `translate(${house + 209} 292)`);
        illustration
          .querySelector('[data-frame="banana"]')
          ?.setAttribute('transform', `translate(${house - 96} 299)`);
        illustration
          .querySelector('[data-frame="tree"]')
          ?.setAttribute('transform', `translate(${Math.max(106, left + 116)} 304)`);
        illustration
          .querySelectorAll('[data-frame="sun"]')
          .forEach((s) => s.setAttribute('cx', String(Math.min(798, right - 64))));
      }
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  // Native SVG animations keep the illustration visible without WebGL, a canvas or a per-frame JS loop.
  useEffect(() => {
    const illustration = svg.current,
      node = host.current;
    if (!illustration || !node) return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    let visible = true,
      frame = 0;
    const paint = () => {
      if (illustration.getCurrentTime() >= farmStoryDuration)
        illustration.setCurrentTime(illustration.getCurrentTime() % farmStoryDuration);
      const value = farmStoryFrame(illustration.getCurrentTime());
      if (activeChapter.current !== value.index) {
        activeChapter.current = value.index;
        setStage(value.index);
      }
      // Only one chapter is mounted. Fade out before the shot change, then fade in.
      illustration.style.setProperty('--shot-opacity', String(running.current ? value.opacity : 1));
      node.style.setProperty('--chapter-progress', `${value.progress * 100}%`);
      if (running.current) frame = requestAnimationFrame(paint);
    };
    const synchronize = () => {
      const blocked = media.matches || document.documentElement.dataset.motion === 'off';
      setMotionBlocked(blocked);
      const stop = paused || blocked || document.hidden || !visible;
      running.current = !stop;
      cancelAnimationFrame(frame);
      if (stop) illustration.pauseAnimations();
      else illustration.unpauseAnimations();
      paint();
    };
    synchronize();
    const intersection = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        synchronize();
      },
      { threshold: 0.02 },
    );
    intersection.observe(node);
    const preferences = new MutationObserver(synchronize);
    preferences.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-motion'],
    });
    media.addEventListener('change', synchronize);
    document.addEventListener('visibilitychange', synchronize);
    return () => {
      intersection.disconnect();
      preferences.disconnect();
      media.removeEventListener('change', synchronize);
      document.removeEventListener('visibilitychange', synchronize);
      illustration.pauseAnimations();
      running.current = false;
      cancelAnimationFrame(frame);
    };
  }, [paused]);
  const chooseChapter = (index: number) => {
    svg.current?.setCurrentTime(farmChapters[index].start + 1);
    activeChapter.current = index;
    setStage(index);
    setPaused(true);
    svg.current?.style.setProperty('--shot-opacity', '1');
  };
  const stages = [
    { label: bn ? 'বোনা' : 'Sow', icon: Hand },
    { label: bn ? 'যত্ন' : 'Care', icon: Droplets },
    { label: bn ? 'বৃদ্ধি' : 'Grow', icon: Sprout },
    { label: bn ? 'কাটা' : 'Harvest', icon: Wheat },
  ];
  return (
    <section
      className="growing-scene"
      data-renderer="svg-2d"
      data-stage={farmChapters[stage].id}
      aria-label={bn ? 'ফসলের যত্নের ২ডি অ্যানিমেশন' : 'An animated farm in 2D'}
    >
      <div
        className="farm-illustration"
        ref={host}
        role="img"
        aria-label={
          bn
            ? 'বিস্তারিত আঁকা বাংলার কৃষিদৃশ্য: কৃষক বীজ বোনেন, চারা যত্ন নেন ও শস্য কাটেন। বসতঘর, ফলগাছ, বাঁশের বেড়া ও সেচের খাল।'
            : 'An original detailed 2D farm illustration: farmers sow seeds, water young plants and harvest grain, with a Bengal homestead, orchard, bamboo fence and irrigation channel.'
        }
      >
        <FarmIllustration svgRef={svg} stage={stage} />
      </div>
      <div className="farm-scene-toolbar">
        <div
          className="farm-scene-stages"
          role="group"
          aria-label={bn ? 'জমির কাজ কাছ থেকে দেখুন' : 'Explore the farm activities'}
        >
          {stages.map(({ label, icon: Icon }, i) => (
            <button
              key={i}
              type="button"
              aria-pressed={stage === i}
              aria-label={`${label} · ${bn ? 'দৃশ্য' : 'chapter'} ${i + 1} ${bn ? 'এর মধ্যে ৪' : 'of 4'}`}
              onClick={() => chooseChapter(i)}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </div>
        <div className="farm-scene-playback">
          <button
            type="button"
            aria-label={bn ? 'শুরু থেকে দেখুন' : 'Replay from sowing'}
            title={bn ? 'শুরু থেকে দেখুন' : 'Replay from sowing'}
            onClick={() => {
              svg.current?.setCurrentTime(0);
              activeChapter.current = 0;
              setStage(0);
              setPaused(false);
            }}
          >
            <RotateCcw size={19} />
          </button>
          <button
            type="button"
            disabled={motionBlocked}
            aria-label={
              motionBlocked
                ? bn
                  ? 'পড়ার সেটিংয়ে অ্যানিমেশন বন্ধ'
                  : 'Animation disabled by motion settings'
                : paused
                  ? bn
                    ? 'অ্যানিমেশন চালান'
                    : 'Play animation'
                  : bn
                    ? 'অ্যানিমেশন থামান'
                    : 'Pause animation'
            }
            title={
              motionBlocked
                ? bn
                  ? 'পড়ার সেটিংয়ে অ্যানিমেশন বন্ধ'
                  : 'Animation disabled by motion settings'
                : paused
                  ? bn
                    ? 'অ্যানিমেশন চালান'
                    : 'Play animation'
                  : bn
                    ? 'অ্যানিমেশন থামান'
                    : 'Pause animation'
            }
            aria-pressed={paused}
            onClick={() => setPaused(!paused)}
          >
            {paused ? <Play size={19} /> : <Pause size={19} />}
          </button>
        </div>
      </div>
      <p className="farm-scene-note">
        {bn
          ? 'কৃষিকাজের আঁকা দৃশ্য · বৃদ্ধির পূর্বাভাস নয়'
          : 'An illustrated farm in motion · not a growth forecast'}
      </p>
    </section>
  );
}
