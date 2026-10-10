'use client';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, Compass, Flag, X } from 'lucide-react';
import { usePlanner } from './planner-provider';
import { Dialog } from './dialog';
import { stepsForTour } from '../data/tours';
import type { TourScope, TourStep } from '../data/tours';
import { animateFrame, prefersReducedMotion } from '../lib/motion';
import { StreamText } from './stream-text';
import { FarmGuide } from './farm-guide';

export const TOUR_STORAGE_KEY = 'ritu-tour-v1';
let autoPrompted = false;
const TRAVEL_MS = 900;
function cardOffset(previous: DOMRect, next: DOMRect) {
  return {
    x: Math.max(16, Math.min(previous.left, window.innerWidth - next.width - 16)) - next.left,
    y: Math.max(16, Math.min(previous.top, window.innerHeight - next.height - 16)) - next.top,
  };
}
interface Run {
  scope: TourScope;
  index: number;
}

export function TourGuide() {
  const { t, ready, setTourPreview } = usePlanner();
  const path = usePathname();
  const [chooser, setChooser] = useState(false);
  const [run, setRun] = useState<Run | null>(null);
  const touring = Boolean(run);
  useEffect(() => {
    setTourPreview(touring);
    return () => setTourPreview(false);
  }, [touring, setTourPreview]);
  useEffect(() => {
    if (!ready || path === '/' || autoPrompted) return;
    try {
      if (localStorage.getItem(TOUR_STORAGE_KEY) === 'seen') return;
    } catch {
      /* A tour is still available without storage. */
    }
    const timer = window.setTimeout(() => {
      autoPrompted = true;
      setRun({ scope: 'full', index: 0 });
    }, 200);
    return () => clearTimeout(timer);
  }, [ready, path]);
  const finish = () => {
    try {
      localStorage.setItem(TOUR_STORAGE_KEY, 'seen');
    } catch {
      /* Remembered for this tab by autoPrompted. */
    }
    setRun(null);
  };
  const choices: { scope: TourScope; title: string; description: string }[] = [
    {
      scope: 'full',
      title: t('Full mission tour', 'সম্পূর্ণ পরিচিতি'),
      description: t(
        'Farm → suggested crops → calendar → tracking',
        'জমি → প্রস্তাবিত ফসল → ক্যালেন্ডার → হিসাব',
      ),
    },
    {
      scope: 'farm',
      title: t('Your farm', 'আপনার জমি'),
      description: t('Inputs, requirements and previous crops', 'তথ্য, প্রয়োজন ও আগের ফসল'),
    },
    {
      scope: 'crops',
      title: t('Suggested crops', 'প্রস্তাবিত ফসল'),
      description: t('Passing windows and your crop choices', 'মেলা সময় ও ফসলের পছন্দ'),
    },
    {
      scope: 'compare',
      title: t('Compare rotations', 'ফসলক্রম তুলনা'),
      description: t('Calendars, priorities and selection', 'ক্যালেন্ডার, অগ্রাধিকার ও পছন্দ'),
    },
    {
      scope: 'field',
      title: t('Interactive field', 'জমির ইন্টারঅ্যাকটিভ দৃশ্য'),
      description: t('Months, camera and crop structures', 'মাস, ক্যামেরা ও ফসলের গঠন'),
    },
    {
      scope: 'insights',
      title: t('Your choice, explained', 'আপনার সিদ্ধান্তের ব্যাখ্যা'),
      description: t('Checks, tradeoffs and missing evidence', 'শর্ত, সুবিধা-সীমা ও বাকি তথ্য'),
    },
    {
      scope: 'track',
      title: t('Track your plan', 'পরিকল্পনার হিসাব'),
      description: t(
        'Saved calendar, planting, harvest and notes',
        'রাখা ক্যালেন্ডার, রোপণ, কাটা ও নোট',
      ),
    },
  ];
  const currentScope: TourScope =
    path === '/farm'
      ? 'farm'
      : path === '/crops'
        ? 'crops'
        : path === '/track'
          ? 'track'
          : path === '/insights'
            ? 'insights'
            : 'compare';
  return (
    <>
      <button
        className="button secondary tour-launch"
        data-tour-launch
        onClick={() => setChooser(true)}
      >
        <Compass size={18} /> {t('Take a tour', 'পরিচিতি দেখুন')}
      </button>
      {chooser && (
        <Dialog
          title={t('Choose your tour', 'যে পরিচিতি দেখতে চান')}
          onClose={() => setChooser(false)}
        >
          <p>
            {t(
              'Follow one mission at a time. Your farm inputs will stay as you left them.',
              'একবারে একটি কাজ জানুন। জমির তথ্য আগের মতো থাকবে।',
            )}
          </p>
          <div className="tour-choices">
            {choices.map((choice) => (
              <button
                className="tour-choice"
                key={choice.scope}
                onClick={() => {
                  setChooser(false);
                  setRun({ scope: choice.scope, index: 0 });
                }}
              >
                <span>
                  <strong>
                    {choice.title}
                    {choice.scope === currentScope && (
                      <small>{t('Current section', 'বর্তমান অংশ')}</small>
                    )}
                  </strong>
                  <span>{choice.description}</span>
                </span>
                <ArrowRight size={20} />
              </button>
            ))}
          </div>
        </Dialog>
      )}
      {run && (
        <TourOverlay
          steps={stepsForTour(run.scope)}
          index={run.index}
          onMove={(index) => setRun({ ...run, index })}
          onClose={finish}
        />
      )}
    </>
  );
}

function TourOverlay({
  steps,
  index,
  onMove,
  onClose,
}: {
  steps: TourStep[];
  index: number;
  onMove: (index: number) => void;
  onClose: () => void;
}) {
  const { t, language, setLanguage, setFieldOpen } = usePlanner();
  const path = usePathname();
  const router = useRouter();
  const step = steps[index];
  const dialog = useRef<HTMLDialogElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const card = useRef<HTMLElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const spotlight = useRef<HTMLDivElement>(null);
  const locked = useRef(true);
  const leaving = useRef<Animation | null>(null);
  const alive = useRef(true);
  const [busy, setBusy] = useState(true);
  const [copyRevealed, setCopyRevealed] = useState(false);
  const [instantText, setInstantText] = useState(false);
  const [canPan, setCanPan] = useState(false);
  const [canPanCalendar, setCanPanCalendar] = useState(false);
  const stopPan = useRef<() => void>(() => {});
  const flip = useRef<{ light: DOMRect | null; card: DOMRect | null } | null>(null);
  const origin = useRef<{ light: DOMRect | null; card: DOMRect | null } | null>(null);
  const [rect, setRect] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);
  const [placement, setPlacement] = useState<{
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  }>({ bottom: 20, right: 20 });
  useLayoutEffect(() => {
    alive.current = true;
    const element = dialog.current;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const original = document.body.style.overflow;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const settle = () => {
      if (prefersReducedMotion())
        element?.getAnimations({ subtree: true }).forEach((animation) => animation.finish());
    };
    preference.addEventListener('change', settle);
    document.addEventListener('ritu-motion-change', settle);
    element?.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      alive.current = false;
      leaving.current?.cancel();
      stopPan.current();
      preference.removeEventListener('change', settle);
      document.removeEventListener('ritu-motion-change', settle);
      element?.close();
      document.body.style.overflow = original;
      (opener?.isConnected && opener !== document.body
        ? opener
        : document.querySelector<HTMLElement>('[data-tour-launch]')
      )?.focus({ preventScroll: true });
    };
  }, []);
  useLayoutEffect(() => {
    document.documentElement.dataset.tourLayout = step.target ? 'active' : 'welcome';
    return () => {
      delete document.documentElement.dataset.tourLayout;
    };
  }, [step.target]);
  useEffect(() => {
    for (const route of new Set(steps.map((item) => item.route))) if (route) router.prefetch(route);
  }, [router, steps]);
  useEffect(() => {
    if (step.route && path !== step.route) router.push(step.route, { scroll: false });
    if (step.scope === 'field') setFieldOpen(true);
  }, [step.route, step.scope, path, router, setFieldOpen]);
  useLayoutEffect(() => {
    if (prefersReducedMotion() || !origin.current?.card || !card.current) return;
    const next = card.current.getBoundingClientRect();
    const offset = cardOffset(origin.current.card, next);
    card.current.style.translate = `${offset.x}px ${offset.y}px`;
  }, [index]);
  // FLIP keeps the floating card and spotlight continuous across different targets.
  useLayoutEffect(() => {
    const previous = flip.current;
    if (!previous) return;
    flip.current = null;
    if (card.current) card.current.style.translate = '0px 0px';
    if (prefersReducedMotion()) return;
    const animations: Animation[] = [];
    if (previous.light && spotlight.current && rect) {
      const next = spotlight.current.getBoundingClientRect();
      animations.push(
        spotlight.current.animate(
          [
            {
              transform: `translate(${previous.light.left - next.left}px, ${previous.light.top - next.top}px) scale(${previous.light.width / Math.max(1, next.width)}, ${previous.light.height / Math.max(1, next.height)})`,
            },
            { transform: 'translate(0, 0) scale(1, 1)' },
          ],
          { duration: TRAVEL_MS, easing: 'cubic-bezier(0.65, 0, 0.35, 1)' },
        ),
      );
    } else if (spotlight.current)
      animations.push(spotlight.current.animate([{ opacity: 0 }, { opacity: 1 }], 500));
    if (previous.card && card.current) {
      card.current.style.translate = '0px 0px';
      const next = card.current.getBoundingClientRect();
      const offset = cardOffset(previous.card, next);
      animations.push(
        card.current.animate(
          [{ translate: `${offset.x}px ${offset.y}px` }, { translate: '0px 0px' }],
          { duration: TRAVEL_MS, easing: 'cubic-bezier(0.65, 0, 0.35, 1)' },
        ),
      );
    }
    return () => animations.forEach((animation) => animation.cancel());
  }, [rect, placement]);
  useEffect(() => {
    if (step.route && path !== step.route) return;
    let frame = 0;
    let started = false;
    let revealed = false;
    let travelDone = !step.target;
    let copyDone = false;
    let cancelled = false;
    let stopScroll = () => {};
    const animations: Animation[] = [];
    const opened: HTMLDetailsElement[] = [];
    locked.current = true;
    leaving.current?.cancel();
    if (copy.current) {
      copy.current.style.opacity = '0';
      copy.current.scrollTop = 0;
    }
    const unlock = () => {
      if (cancelled || !travelDone || !copyDone) return;
      locked.current = false;
      setBusy(false);
      title.current?.focus({ preventScroll: true });
    };
    const reveal = () => {
      if (cancelled || revealed) return;
      revealed = true;
      setCopyRevealed(true);
      if (copy.current) copy.current.style.opacity = '1';
      const finish = () => {
        if (cancelled) return;
        copyDone = true;
        unlock();
      };
      if (prefersReducedMotion() || !copy.current) return finish();
      const children = Array.from(copy.current.children);
      children.forEach((child, i) => {
        animations.push(
          child.animate(
            [
              { opacity: 0, transform: 'translateY(9px)' },
              { opacity: 1, transform: 'translateY(0)' },
            ],
            {
              duration: 340,
              delay: Math.min(i * 30, 120),
              fill: 'backwards',
              easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
            },
          ),
        );
      });
      const last = animations.at(-1);
      if (last) void last.finished.then(finish).catch(() => {});
      else finish();
    };
    const measure = () => {
      if (started || cancelled) return;
      const target = step.target ? document.querySelector<HTMLElement>(step.target) : null;
      let ancestor = target?.parentElement;
      while (ancestor) {
        if (ancestor instanceof HTMLDetailsElement && !ancestor.open) {
          ancestor.open = true;
          opened.push(ancestor);
        }
        ancestor = ancestor.parentElement;
      }
      if (step.target && (!target || !target.offsetHeight)) return;
      started = true;
      const original = target?.getBoundingClientRect();
      const pad = 7;
      const cardHeight = card.current?.offsetHeight ?? 310;
      const cardWidth = card.current?.offsetWidth ?? Math.min(480, window.innerWidth - 32);
      const desktop = window.innerWidth >= 1200;
      const available = desktop ? window.innerHeight - 32 : window.innerHeight - cardHeight - 40;
      setCanPan(Boolean(original && original.height > available + 8));
      setCanPanCalendar(
        Boolean(target?.matches('.calendar-scroll') && target.scrollWidth > target.clientWidth),
      );
      const desiredTop = original ? 16 + Math.max(0, (available - original.height) / 2) : 0;
      const fromScroll = window.scrollY;
      const toScroll = original
        ? Math.max(
            0,
            Math.min(
              document.documentElement.scrollHeight - window.innerHeight,
              fromScroll + original.top - desiredTop,
            ),
          )
        : fromScroll;
      const bounds = original
        ? {
            left: original.left,
            right: original.right,
            top: original.top - (toScroll - fromScroll),
            bottom: original.bottom - (toScroll - fromScroll),
            height: original.height,
          }
        : null;
      flip.current = origin.current ?? {
        light: spotlight.current?.getBoundingClientRect() ?? null,
        card: card.current?.getBoundingClientRect() ?? null,
      };
      origin.current = null;
      if (bounds && bounds.height > 0) {
        const left = Math.max(8, bounds.left - pad);
        const top = Math.max(8, bounds.top - pad);
        const right = Math.min(
          desktop ? window.innerWidth - cardWidth - 32 : window.innerWidth - 8,
          bounds.right + pad,
        );
        const bottom = Math.min(
          desktop ? window.innerHeight - 8 : window.innerHeight - cardHeight - 24,
          bounds.bottom + pad,
        );
        setRect({ left, top, width: Math.max(0, right - left), height: Math.max(0, bottom - top) });
        setPlacement(desktop ? { top: 16, right: 16 } : { bottom: 8, right: 8 });
      } else {
        setRect(null);
        setPlacement({ bottom: 20, right: 20 });
      }
      if (!target) return reveal();
      stopScroll = animateFrame(
        TRAVEL_MS,
        (progress) => {
          window.scrollTo({
            top: fromScroll + (toScroll - fromScroll) * progress,
            behavior: 'instant',
          });
          if (progress >= 0.03) reveal();
        },
        () => {
          travelDone = true;
          reveal();
          unlock();
        },
      );
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    const resized = () => {
      stopScroll();
      animations.forEach((animation) => animation.cancel());
      started = false;
      revealed = false;
      travelDone = !step.target;
      copyDone = false;
      locked.current = true;
      setBusy(true);
      setCopyRevealed(false);
      if (copy.current) copy.current.style.opacity = '0';
      schedule();
    };
    schedule();
    const observer = new MutationObserver(schedule);
    const main = document.getElementById('main');
    if (main) observer.observe(main, { childList: true, subtree: true });
    window.addEventListener('resize', resized);
    return () => {
      cancelled = true;
      stopScroll();
      animations.forEach((animation) => animation.cancel());
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize', resized);
      opened.forEach((details) => {
        if (details.isConnected) details.open = false;
      });
    };
  }, [step, path, language]);
  const move = (next: number) => {
    if (locked.current) return;
    locked.current = true;
    stopPan.current();
    setBusy(true);
    origin.current = {
      light: spotlight.current?.getBoundingClientRect() ?? null,
      card: card.current?.getBoundingClientRect() ?? null,
    };
    if (prefersReducedMotion() || !copy.current) {
      setCopyRevealed(false);
      return onMove(next);
    }
    leaving.current = copy.current.animate(
      [
        { opacity: 1, transform: 'translateY(0)' },
        { opacity: 0, transform: 'translateY(-5px)' },
      ],
      { duration: 160, fill: 'forwards', easing: 'ease-in' },
    );
    void leaving.current.finished
      .then(() => {
        if (alive.current) {
          setCopyRevealed(false);
          onMove(next);
        }
      })
      .catch(() => {});
  };
  const isWelcome = step.id === 'welcome';
  const panSection = (direction: number) => {
    if (busy || !step.target) return;
    const target = document.querySelector<HTMLElement>(step.target);
    if (!target || !card.current) return;
    stopPan.current();
    const desktop = window.innerWidth >= 1200;
    const bottom = desktop ? window.innerHeight - 8 : card.current.getBoundingClientRect().top - 16;
    const from = window.scrollY;
    const bounds = target.getBoundingClientRect();
    const desired =
      direction > 0
        ? Math.min(from + (bottom - 16) * 0.65, from + bounds.bottom - bottom + 7)
        : Math.max(from - (bottom - 16) * 0.65, from + bounds.top - 16);
    const to = Math.max(
      0,
      Math.min(document.documentElement.scrollHeight - window.innerHeight, desired),
    );
    stopPan.current = animateFrame(600, (progress) => {
      window.scrollTo({ top: from + (to - from) * progress, behavior: 'instant' });
      const b = target.getBoundingClientRect();
      const left = Math.max(8, b.left - 7);
      const top = Math.max(8, b.top - 7);
      const right = Math.min(
        desktop ? card.current!.getBoundingClientRect().left - 16 : window.innerWidth - 8,
        b.right + 7,
      );
      setRect({
        left,
        top,
        width: Math.max(0, right - left),
        height: Math.max(0, Math.min(bottom, b.bottom + 7) - top),
      });
    });
  };
  const navigating = Boolean(step.route && path !== step.route);
  const changeLanguage = (next: 'en' | 'bn') => {
    if (language === next || locked.current) return;
    locked.current = true;
    setBusy(true);
    setCopyRevealed(false);
    setLanguage(next);
  };
  return (
    <dialog
      ref={dialog}
      className={`tour-dialog ${isWelcome ? 'tour-welcome' : ''}`}
      aria-labelledby="tour-title"
      aria-describedby="tour-description"
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return;
        const controls = Array.from(
          event.currentTarget.querySelectorAll<HTMLElement>(
            'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), [tabindex="0"]',
          ),
        );
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (
          event.shiftKey &&
          (document.activeElement === first || document.activeElement === title.current)
        ) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      {rect && !isWelcome ? (
        <div ref={spotlight} className="tour-spotlight" style={rect} aria-hidden="true" />
      ) : (
        <div className="tour-shade" aria-hidden="true" />
      )}
      <article
        className="tour-card"
        ref={card}
        style={isWelcome ? undefined : placement}
        aria-busy={busy}
      >
        <div className="tour-card-top">
          <FarmGuide step={step.id} />
          <span>
            <Flag size={17} />
            {step.mission[language]}
          </span>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label={t('Close tour', 'পরিচিতি বন্ধ করুন')}
          >
            <X size={20} />
          </button>
        </div>
        <div className="tour-copy" ref={copy}>
          <div
            className="tour-progress"
            role="progressbar"
            aria-label={t('Tour progress', 'পরিচিতির অগ্রগতি')}
            aria-valuenow={index + 1}
            aria-valuemin={1}
            aria-valuemax={steps.length}
          >
            <span style={{ width: `${((index + 1) / steps.length) * 100}%` }} />
          </div>
          <p className="tour-step-number">
            {t(`Step ${index + 1} of ${steps.length}`, `ধাপ ${index + 1} / ${steps.length}`)}
          </p>
          <h2 ref={title} id="tour-title" tabIndex={-1}>
            <StreamText text={step.title[language]} reveal={copyRevealed} instant={instantText} />
          </h2>
          <p id="tour-description">
            <StreamText
              text={step.description[language]}
              reveal={copyRevealed}
              instant={instantText}
            />
          </p>
          <div
            className="language-switch tour-languages"
            aria-label={t('Tour language', 'পরিচিতির ভাষা')}
          >
            <button
              disabled={busy}
              onClick={() => changeLanguage('en')}
              aria-pressed={language === 'en'}
            >
              EN
            </button>
            <button
              disabled={busy}
              onClick={() => changeLanguage('bn')}
              aria-pressed={language === 'bn'}
              lang="bn"
            >
              বাংলা
            </button>
          </div>
          <button
            className="text-button instant-text"
            onClick={() => setInstantText(true)}
            aria-pressed={instantText}
          >
            {t('Show text instantly', 'সব লেখা একসঙ্গে দেখুন')}
          </button>
        </div>
        {(canPan || canPanCalendar) && !isWelcome && (
          <div
            className="tour-section-navigation"
            role="group"
            aria-label={t('Explore the highlighted section', 'চিহ্নিত অংশ দেখুন')}
          >
            {canPan && (
              <>
                <button
                  disabled={busy}
                  onClick={() => panSection(-1)}
                  aria-label={t('Show upper part of section', 'অংশের ওপরের ভাগ দেখুন')}
                >
                  ↑
                </button>
                <button
                  disabled={busy}
                  onClick={() => panSection(1)}
                  aria-label={t('Show lower part of section', 'অংশের নিচের ভাগ দেখুন')}
                >
                  ↓
                </button>
              </>
            )}
            {canPanCalendar && (
              <>
                <button
                  disabled={busy}
                  onClick={() =>
                    document.querySelector(step.target!)?.scrollBy({
                      left: -300,
                      behavior: prefersReducedMotion() ? 'instant' : 'smooth',
                    })
                  }
                  aria-label={t('Earlier calendar months', 'ক্যালেন্ডারের আগের মাস')}
                >
                  ←
                </button>
                <button
                  disabled={busy}
                  onClick={() =>
                    document.querySelector(step.target!)?.scrollBy({
                      left: 300,
                      behavior: prefersReducedMotion() ? 'instant' : 'smooth',
                    })
                  }
                  aria-label={t('Later calendar months', 'ক্যালেন্ডারের পরের মাস')}
                >
                  →
                </button>
              </>
            )}
            <span>{t('Explore this section', 'এই অংশ দেখুন')}</span>
          </div>
        )}
        <div className="tour-card-actions">
          <button className="text-button" onClick={onClose}>
            {t('Skip tour', 'পরিচিতি বাদ দিন')}
          </button>
          <div>
            {index > 0 && (
              <button className="button secondary" disabled={busy} onClick={() => move(index - 1)}>
                <ArrowLeft size={17} />
                {t('Back', 'আগের ধাপ')}
              </button>
            )}
            <button
              className="button primary"
              disabled={navigating || busy}
              onClick={() => (index === steps.length - 1 ? onClose() : move(index + 1))}
            >
              {index === steps.length - 1 ? (
                <>
                  <Check size={17} />
                  {t('Finish tour', 'পরিচিতি শেষ করুন')}
                </>
              ) : (
                <>
                  {isWelcome ? t('Start the tour', 'পরিচিতি শুরু করুন') : t('Next', 'পরের ধাপ')}
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </div>
        </div>
        <span className="tour-keyboard-hint">
          {t(
            'Use Tab to move between controls · Esc to leave',
            'Tab দিয়ে নিয়ন্ত্রণে যান · Esc দিয়ে বন্ধ করুন',
          )}
        </span>
      </article>
    </dialog>
  );
}
