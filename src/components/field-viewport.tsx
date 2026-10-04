'use client';
import { useEffect, useRef, useState } from 'react';
import { RotateCcw, RotateCw, ZoomIn, ZoomOut, Scan, Hand, MoveLeft } from 'lucide-react';
import type { CameraAction, FieldAppearance, FieldController } from './field-scene';
import { usePlanner } from './planner-provider';
import { FieldArt } from './field-art';

export function FieldViewport({
  appearance,
  onInspect,
}: {
  appearance: Omit<FieldAppearance, 'orbit'>;
  onInspect: () => void;
}) {
  const { t } = usePlanner();
  const host = useRef<HTMLDivElement>(null);
  const controller = useRef<FieldController | null>(null);
  const inputs = useRef<FieldAppearance>({ ...appearance, orbit: false });
  const [orbit, setOrbit] = useState(false);
  const [status, setStatus] = useState<'loading' | 'ready' | 'fallback'>('loading');
  useEffect(() => {
    inputs.current = { ...appearance, orbit };
    controller.current?.update(inputs.current);
  }, [appearance, orbit]);
  useEffect(() => {
    let cancelled = false;
    let scene: FieldController | null = null;
    import('./field-scene')
      .then(({ createFieldScene }) => {
        if (cancelled || !host.current) return;
        scene = createFieldScene(host.current, onInspect, () => setStatus('fallback'));
        controller.current = scene;
        scene.update(inputs.current);
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('fallback');
      });
    return () => {
      cancelled = true;
      scene?.dispose();
      controller.current = null;
    };
  }, [onInspect]);
  const command = (action: CameraAction) => controller.current?.camera(action);
  return (
    <div className="field-viewport" data-renderer={status}>
      <div className="field-canvas" ref={host} aria-hidden="true" />
      <div className="field-fallback" aria-hidden={status === 'ready'}>
        <FieldArt />
        <span>
          {status === 'loading'
            ? t('Loading the field view…', 'জমির দৃশ্য লোড হচ্ছে…')
            : t(
                '3D is unavailable here. All planning controls still work.',
                'এখানে ৩ডি সম্ভব নয়। পরিকল্পনার সব নিয়ন্ত্রণ ব্যবহার করতে পারবেন।',
              )}
        </span>
      </div>
      <div
        className="field-camera-controls"
        aria-label={t('Field view controls', 'জমির দৃশ্যের নিয়ন্ত্রণ')}
      >
        <button
          disabled={status !== 'ready'}
          onClick={() => command('left')}
          aria-label={t('Rotate field left', 'জমি বামে ঘোরান')}
          title={t('Rotate left', 'বামে ঘোরান')}
        >
          <MoveLeft size={18} />
        </button>
        <button
          disabled={status !== 'ready'}
          onClick={() => command('right')}
          aria-label={t('Rotate field right', 'জমি ডানে ঘোরান')}
          title={t('Rotate right', 'ডানে ঘোরান')}
        >
          <RotateCw size={18} />
        </button>
        <button
          disabled={status !== 'ready'}
          onClick={() => command('top')}
          aria-label={t('View field from above', 'জমি ওপর থেকে দেখুন')}
          title={t('Top view', 'ওপর থেকে দেখুন')}
        >
          <Scan size={18} />
        </button>
        <button
          disabled={status !== 'ready'}
          onClick={() => command('in')}
          aria-label={t('Zoom into field', 'জমি কাছে দেখুন')}
          title={t('Zoom in', 'কাছে দেখুন')}
        >
          <ZoomIn size={18} />
        </button>
        <button
          disabled={status !== 'ready'}
          onClick={() => command('out')}
          aria-label={t('Zoom out of field', 'জমি দূর থেকে দেখুন')}
          title={t('Zoom out', 'দূর থেকে দেখুন')}
        >
          <ZoomOut size={18} />
        </button>
        <button
          disabled={status !== 'ready'}
          onClick={() => command('reset')}
          aria-label={t('Reset field camera', 'জমির ক্যামেরা রিসেট')}
          title={t('Reset view', 'দৃশ্য রিসেট')}
        >
          <RotateCcw size={18} />
        </button>
      </div>
      <button
        className="field-orbit-toggle"
        disabled={status !== 'ready'}
        aria-pressed={orbit}
        onClick={() => setOrbit((value) => !value)}
      >
        <Hand size={16} />
        {orbit
          ? t('Drag to rotate · turn off', 'টেনে ঘোরান · বন্ধ করুন')
          : t('Enable drag to rotate', 'টেনে ঘোরানো চালু করুন')}
      </button>
    </div>
  );
}
