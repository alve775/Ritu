import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
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

/** Mirrors CSS `color-mix(in srgb, fg pct%, bg)`: linear interpolation of the 0-255 channels. */
function mix(fg: RGB, pct: number, bg: RGB): RGB {
  return fg.map((c, i) => Math.round(pct * c + (1 - pct) * bg[i])) as RGB;
}

// [foreground token, tint token, tint share] for text on a tinted chip/pill (components.css).
const tinted: [string, string, number][] = [
  ['season-pre-text', 'season-pre', 0.14],
  ['season-mon-text', 'season-mon', 0.14],
  ['season-win-text', 'season-win', 0.14],
  ['color-danger', 'color-danger', 0.12],
];

describe.each([
  ['light', light],
  ['dark', { ...light, ...darkManual }],
])('%s theme tinted chip contrast', (_, tokens) => {
  it.each(tinted)('--%s on %s tint (%s) ≥ 4.5:1', (fg, tint, share) => {
    const surface = resolve(tokens, 'color-surface');
    const background = mix(resolve(tokens, tint), share, surface);
    expect(ratio(resolve(tokens, fg), background)).toBeGreaterThanOrEqual(4.5);
  });
});

it('defines the dark theme identically for Auto and manual Dark', () => {
  expect(darkAuto).toEqual(darkManual);
});

// --color-accent is 3.4:1 on the light surface, so it is only for large text (>= 24px, or >= 18.66px bold).
// Every use outside tokens.css must be one of these selectors.
const largeTextAccentSelectors = ['h1 em, h2 em'];

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(css|tsx?)$/.test(name) && !name.endsWith('.test.ts') ? [path] : [];
  });
}

it('uses --color-accent only for large text', () => {
  const srcRoot = fileURLToPath(new URL('..', import.meta.url));
  const used: string[] = [];
  for (const file of sourceFiles(srcRoot)) {
    if (file.endsWith('tokens.css')) continue;
    const source = readFileSync(file, 'utf8');
    if (!file.endsWith('.css')) {
      expect(source, `${file} references --color-accent`).not.toContain('--color-accent');
      continue;
    }
    for (const [, selector, body] of source.matchAll(
      /([^{}]+)\{([^{}]*var\(--color-accent\)[^{}]*)\}/g,
    )) {
      expect(body, `${file} uses --color-accent outside a text colour`).toMatch(
        /(^|[;\s])color:\s*var\(--color-accent\)/,
      );
      used.push(selector.replace(/\s+/g, ' ').trim());
    }
  }
  expect(used.sort()).toEqual(largeTextAccentSelectors);
});
