import { describe, expect, it } from 'vitest';
import { localDigits } from './numerals';

describe('localDigits', () => {
  it('uses Bengali digits in Bangla only', () => {
    expect(localDigits(10.25, 'bn')).toBe('১০.২৫');
    expect(localDigits('Plot 3', 'en')).toBe('Plot 3');
  });
});
