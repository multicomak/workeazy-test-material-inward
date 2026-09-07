import { describe, expect, it } from 'vitest';
import { buildSpecKey, canonicalSpecs } from '@/lib/steel/specKey';
import { buildDisplayName } from '@/lib/steel/displayName';

describe('buildSpecKey', () => {
  it('is order- and precision-independent', () => {
    const a = buildSpecKey('pipe', { od: 100, thickness: 5.0, nb: 100, length: 6 });
    const b = buildSpecKey('pipe', { length: 6, nb: 100, od: 100, thickness: 5 });
    expect(a).toBe(b);
    expect(a).toBe('pipe|length=6|nb=100|od=100|thickness=5');
  });

  it('treats numeric strings as numbers', () => {
    expect(buildSpecKey('pipe', { od: '101.60', thickness: '5', nb: '100', length: '6.000' })).toBe(
      buildSpecKey('pipe', { od: 101.6, thickness: 5, nb: 100, length: 6 }),
    );
  });

  it('lowercases non-numeric values', () => {
    expect(buildSpecKey('di_pipe', { od: 200, class: 'K9', length: 6 })).toBe(
      buildSpecKey('di_pipe', { od: 200, class: 'k9', length: 6 }),
    );
  });

  it('ignores keys the category does not declare', () => {
    expect(buildSpecKey('coil', { width: 1200, thickness: 2.5, length: 99 })).toBe(
      'coil|thickness=2.5|width=1200',
    );
  });

  it('separates SKUs that differ only by length', () => {
    expect(buildSpecKey('pipe', { nb: 100, od: 100, thickness: 5, length: 6 })).not.toBe(
      buildSpecKey('pipe', { nb: 100, od: 100, thickness: 5, length: 5.5 }),
    );
  });

  it('canonicalSpecs keeps only declared fields', () => {
    expect(canonicalSpecs('coil', { width: '1200', thickness: '2.5', junk: 1 })).toEqual({
      width: 1200,
      thickness: 2.5,
    });
  });
});

describe('buildDisplayName', () => {
  it('names one material per category', () => {
    expect(
      buildDisplayName({ category: 'pipe', specs: { nb: 100, od: 100, thickness: 5, length: 6 }, grade: 'GI Z275' }),
    ).toBe('GI Z275 · NB100 OD100 × t5 × 6m');
    expect(
      buildDisplayName({ category: 'angle', specs: { leg_a: 50, leg_b: 50, thickness: 6, length: 6 } }),
    ).toBe('Angle 50×50×6 × 6m');
    expect(buildDisplayName({ category: 'channel', specs: { designation: '100', length: 6 } })).toBe(
      'ISMC 100 × 6m',
    );
    expect(buildDisplayName({ category: 'ibeam', specs: { designation: '200', length: 6 } })).toBe(
      'ISMB 200 × 6m',
    );
    expect(buildDisplayName({ category: 'hbeam', specs: { designation: '300', length: 6 } })).toBe(
      'ISWB 300 × 6m',
    );
    expect(
      buildDisplayName({ category: 'rod', specs: { width: 50, thickness: 10, length: 6 }, sub_category: 'Flat' }),
    ).toBe('Flat 50×10 × 6m');
    expect(
      buildDisplayName({ category: 'sheet', specs: { width: 1200, thickness: 0.8, length: 2.4 }, sub_category: 'PPGI' }),
    ).toBe('PPGI 1200×0.8 × 2.4m');
    expect(buildDisplayName({ category: 'di_pipe', specs: { od: 200, class: 'K9', length: 6 } })).toBe(
      'DI K9 OD200 × 6m',
    );
    expect(
      buildDisplayName({ category: 'coil', specs: { width: 1200, thickness: 2.5 }, sub_category: 'HR' }),
    ).toBe('HR 1200×2.5');
  });
});
