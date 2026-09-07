import { describe, expect, it } from 'vitest';
import {
  angleDesignation,
  computeWeight,
  kgPerSqft,
  kgPerSqm,
  WeightError,
} from '@/lib/steel/weight';
import { DI_CLASS_SEED, IS808_SEED } from '@/lib/steel/seedData';
import type { Lookups } from '@/lib/steel/types';

const lookups: Lookups = { is808: IS808_SEED, diClasses: DI_CLASS_SEED };
const noLookups: Lookups = { is808: [], diClasses: [] };

describe('pipe', () => {
  it('pipe (od 100, t 5, len 6)', () => {
    const r = computeWeight('pipe', { nb: 100, od: 100, thickness: 5, length: 6 }, lookups);
    expect(r.weightPerM).toBeCloseTo(11.7135, 6);
    expect(r.weightPerPiece).toBeCloseTo(70.281, 6);
    expect(r.source).toBe('formula');
  });
});

describe('angle', () => {
  it('ISA 50x50x6 x 6 resolves from IS 808', () => {
    const r = computeWeight('angle', { leg_a: 50, leg_b: 50, thickness: 6, length: 6 }, lookups);
    expect(r.weightPerM).toBeCloseTo(4.47, 6);
    expect(r.weightPerPiece).toBeCloseTo(26.82, 6);
    expect(r.source).toBe('is808');
    expect(r.resolvedDesignation).toBe('50x50x6');
  });

  it('ISA 55x55x6 x 6 falls back to the approximate formula', () => {
    const r = computeWeight('angle', { leg_a: 55, leg_b: 55, thickness: 6, length: 6 }, lookups);
    expect(r.weightPerM).toBeCloseTo(4.8984, 6);
    expect(r.source).toBe('angle_formula');
  });

  it('normalises designation with the longer leg first', () => {
    expect(angleDesignation(50, 65, 6)).toBe('65x50x6');
    expect(angleDesignation(65, 50, 6.0)).toBe('65x50x6');
  });
});

describe('is808 sections', () => {
  it('channel ISMC 100 x 6', () => {
    const r = computeWeight('channel', { designation: '100', length: 6 }, lookups);
    expect(r.weightPerM).toBeCloseTo(9.56, 6);
    expect(r.weightPerPiece).toBeCloseTo(57.36, 6);
    expect(r.source).toBe('is808');
  });

  it('ibeam ISMB 200 x 6', () => {
    const r = computeWeight('ibeam', { designation: '200', length: 6 }, lookups);
    expect(r.weightPerPiece).toBeCloseTo(152.4, 6);
  });

  it('hbeam ISWB 300 x 6', () => {
    const r = computeWeight('hbeam', { designation: '300', length: 6 }, lookups);
    expect(r.weightPerPiece).toBeCloseTo(340.8, 6);
  });

  it('blocks a section that is not in the table', () => {
    expect(() => computeWeight('channel', { designation: '999', length: 6 }, lookups)).toThrow(
      WeightError,
    );
    try {
      computeWeight('channel', { designation: '999', length: 6 }, lookups);
    } catch (e) {
      expect((e as WeightError).code).toBe('is808_missing');
    }
  });
});

describe('solid sections', () => {
  it('rod (50, 10, 6)', () => {
    const r = computeWeight('rod', { width: 50, thickness: 10, length: 6 }, lookups);
    expect(r.weightPerM).toBeCloseTo(3.925, 6);
    expect(r.weightPerPiece).toBeCloseTo(23.55, 6);
  });

  it('sheet (1200, 0.8, 2.4) plus area factors', () => {
    const r = computeWeight('sheet', { width: 1200, thickness: 0.8, length: 2.4 }, lookups);
    expect(r.weightPerM).toBeCloseTo(7.536, 6);
    expect(r.weightPerPiece).toBeCloseTo(18.0864, 6);
    expect(kgPerSqft(0.8)).toBeCloseTo(0.58344, 6);
    expect(kgPerSqm(0.8)).toBeCloseTo(6.28, 6);
  });

  it('coil (1200, 2.5) has no weight per piece', () => {
    const r = computeWeight('coil', { width: 1200, thickness: 2.5 }, lookups);
    expect(r.weightPerM).toBeCloseTo(23.55, 6);
    expect(r.weightPerPiece).toBeNull();
  });
});

describe('di pipe', () => {
  it('(200, K9, 6) uses the seeded table thickness', () => {
    const r = computeWeight('di_pipe', { od: 200, class: 'K9', length: 6 }, lookups);
    expect(r.resolvedThicknessMm).toBe(10.5);
    expect(r.weightPerM).toBeCloseTo(49.07, 2);
    expect(r.weightPerPiece).toBeCloseTo(294.4, 1);
    expect(r.source).toBe('di_table');
  });

  it('(300, K9, 6) falls back to the class formula', () => {
    const r = computeWeight('di_pipe', { od: 300, class: 'K9', length: 6 }, lookups);
    expect(r.resolvedThicknessMm).toBe(18);
    expect(r.source).toBe('di_formula');
  });

  it('K7 and K12 fallbacks', () => {
    expect(
      computeWeight('di_pipe', { od: 240, class: 'K7', length: 6 }, noLookups)
        .resolvedThicknessMm,
    ).toBe(13);
    expect(
      computeWeight('di_pipe', { od: 320, class: 'K12', length: 6 }, noLookups)
        .resolvedThicknessMm,
    ).toBe(23);
  });
});
