import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

type RGB = [number, number, number];
const css = readFileSync(new URL('./tokens.css', import.meta.url), 'utf8');

function block(selector: RegExp): Record<string, string> {
  const match = css.match(selector);
  if (!match) throw new Error(`Missing token block ${selector}`);
  const tokens: Record<string, string> = {};
  for (const [, name, value] of match[1].matchAll(/--([\w-]+):\s*([^;]+);/g))
    tokens[name] = value.trim();
  return tokens;
}
const light = block(/:root \{([^}]*)\}/);
const darkAuto = block(/:root:not\(\[data-theme='light'\]\) \{([^}]*)\}/);
const darkManual = block(/:root\[data-theme='dark'\] \{([^}]*)\}/);

function parse(value: string): { rgb: RGB; alpha: number } {
  const hex = value.match(/^#([0-9a-f]{6})$/i);
  if (hex) {
    const n = hex[1];
    return { rgb: [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16)) as RGB, alpha: 1 };
  }
  const rgba = value.match(/^rgba\(\s*(\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\s*\)$/);
  if (rgba) return { rgb: [+rgba[1], +rgba[2], +rgba[3]], alpha: +rgba[4] };
  throw new Error(`Unsupported colour ${value}`);
}
function resolve(tokens: Record<string, string>, name: string): RGB {
  const value = tokens[name];
  if (!value) throw new Error(`Missing token --${name}`);
  const { rgb, alpha } = parse(value);
  if (alpha === 1) return rgb;
  const base = resolve(tokens, 'color-surface');
  return rgb.map((c, i) => Math.round(alpha * c + (1 - alpha) * base[i])) as RGB;
}
function luminance([r, g, b]: RGB) {
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}
function ratio(a: RGB, b: RGB) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const pairs: [string, string, number][] = [
  ['color-ink', 'color-bg', 4.5],
  ['color-ink', 'color-surface', 4.5],
  ['color-ink-muted', 'color-bg', 4.5],
  ['color-ink-muted', 'color-surface', 4.5],
  ['color-ink-muted', 'color-soft', 4.5],
  ['color-on-primary', 'color-primary', 4.5],
  ['color-primary', 'color-bg', 4.5],
  ['color-accent', 'color-bg', 3],
  ['color-warn-ink', 'color-warn-bg', 4.5],
  ['color-success-ink', 'color-success-bg', 4.5],
  ['color-danger', 'color-surface', 4.5],
  ['season-pre-text', 'color-surface', 4.5],
  ['season-mon-text', 'color-surface', 4.5],
  ['season-win-text', 'color-surface', 4.5],
  ['season-pre', 'wheel-track', 3],
  ['season-mon', 'wheel-track', 3],
  ['season-win', 'wheel-track', 3],
  ['season-pre', 'color-surface', 3],
  ['season-mon', 'color-surface', 3],
  ['season-win', 'color-surface', 3],
  ['stage-ink', 'stage-bg', 4.5],
  ['stage-muted', 'stage-bg', 4.5],
];

describe.each([
  ['light', light],
  ['dark', { ...light, ...darkManual }],
])('%s theme contrast', (_, tokens) => {
  it.each(pairs)('--%s on --%s ≥ %s:1', (fg, bg, min) => {
    expect(ratio(resolve(tokens, fg), resolve(tokens, bg))).toBeGreaterThanOrEqual(min);
  });
});

it('defines the dark theme identically for Auto and manual Dark', () => {
  expect(darkAuto).toEqual(darkManual);
});
