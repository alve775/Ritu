import { describe, expect, it } from 'vitest';
import { parseTheme } from './display-store';

describe('parseTheme', () => {
  it.each(['auto', 'light', 'dark'] as const)('keeps %s', (theme) => {
    expect(parseTheme(theme)).toBe(theme);
  });
  it.each([undefined, null, '', 'Dark', 'system', 1, {}])('falls back to auto for %s', (value) => {
    expect(parseTheme(value)).toBe('auto');
  });
});
