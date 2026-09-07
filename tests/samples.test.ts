import { describe, expect, it } from 'vitest';
import { computeWeight } from '@/lib/steel/weight';
import { buildSpecKey } from '@/lib/steel/specKey';
import { buildDisplayName } from '@/lib/steel/displayName';
import { DI_CLASS_SEED, IS808_SEED } from '@/lib/steel/seedData';
import { SAMPLE_MATERIALS } from '@/lib/steel/samples';
import type { Lookups } from '@/lib/steel/types';

const lookups: Lookups = { is808: IS808_SEED, diClasses: DI_CLASS_SEED };

describe('Appendix A sample materials — one per category', () => {
  it.each(SAMPLE_MATERIALS.map((s) => [s.category, s] as const))(
    '%s computes the expected weight',
    (_category, sample) => {
      const w = computeWeight(sample.category, sample.specs, lookups);
      expect(w.weightPerM).toBeCloseTo(sample.expectedWeightPerM, 4);
      if (sample.expectedWeightPerPiece === null) {
        expect(w.weightPerPiece).toBeNull();
      } else {
        expect(w.weightPerPiece).toBeCloseTo(sample.expectedWeightPerPiece, 1);
      }
      expect(w.source).toBe(sample.expectedSource);
    },
  );

  it('covers every category exactly once', () => {
    const codes = SAMPLE_MATERIALS.map((s) => s.category);
    expect(new Set(codes).size).toBe(codes.length);
    expect(codes.length).toBe(9);
  });

  it('gives every sample a distinct spec_key and a display name', () => {
    const keys = SAMPLE_MATERIALS.map((s) => buildSpecKey(s.category, s.specs));
    expect(new Set(keys).size).toBe(keys.length);
    for (const sample of SAMPLE_MATERIALS) {
      expect(buildDisplayName(sample).length).toBeGreaterThan(3);
    }
  });

  it('only the coil has no length', () => {
    for (const sample of SAMPLE_MATERIALS) {
      const hasLength = 'length' in sample.specs;
      expect(hasLength).toBe(sample.category !== 'coil');
    }
  });
});
