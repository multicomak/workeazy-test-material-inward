import { describe, expect, it } from 'vitest';
import { calcInward, lengthMismatch, statusFor } from '@/lib/steel/inward';
import { computeWeight } from '@/lib/steel/weight';
import { fromKg } from '@/lib/steel/units';
import { DI_CLASS_SEED, IS808_SEED } from '@/lib/steel/seedData';
import type { CategoryCode, Lookups, MaterialLike } from '@/lib/steel/types';

const lookups: Lookups = { is808: IS808_SEED, diClasses: DI_CLASS_SEED };

function material(category: CategoryCode, specs: Record<string, unknown>): MaterialLike {
  const w = computeWeight(category, specs, lookups);
  return { category, specs, weight_per_m: w.weightPerM, weight_per_piece: w.weightPerPiece };
}

const pipe100 = material('pipe', { nb: 100, od: 100, thickness: 5, length: 6 });
const sheet = material('sheet', { width: 1200, thickness: 0.8, length: 2.4 });
const coil = material('coil', { width: 1200, thickness: 2.5 });

describe('Appendix C scenarios', () => {
  it('1. pipe within tolerance is accepted', () => {
    const calc = calcInward(pipe100, { actualWeightKg: 690, pieces: 10 });
    expect(calc.kind).toBe('standard');
    if (calc.kind !== 'standard') return;
    expect(calc.theoreticalKg).toBeCloseTo(702.81, 2);
    expect(calc.toleranceKg).toBeCloseTo(-12.81, 2);
    expect(calc.tolerancePct).toBeCloseTo(-1.82, 2);
    expect(statusFor(calc)).toBe('accepted');
    expect(fromKg(690, 'M', pipe100)).toBeCloseTo(58.91, 2);
  });

  it('2. an actual length that differs from the master is a different SKU', () => {
    expect(lengthMismatch(pipe100, 5.5)).toEqual({ master: 6, actual: 5.5 });
    expect(lengthMismatch(pipe100, 6)).toBeNull();
    expect(lengthMismatch(pipe100, null)).toBeNull();
    expect(lengthMismatch(coil, 5.5)).toBeNull();
  });

  it('3. pipe outside tolerance needs approval', () => {
    const calc = calcInward(pipe100, { actualWeightKg: 640, pieces: 10 });
    if (calc.kind !== 'standard') throw new Error('expected standard');
    expect(calc.tolerancePct).toBeCloseTo(-8.94, 2);
    expect(calc.withinTolerance).toBe(false);
    expect(statusFor(calc)).toBe('pending_approval');
  });

  it('4. coil derives length and never checks tolerance', () => {
    const calc = calcInward(coil, { actualWeightKg: 24500, pieces: 1 });
    expect(calc.kind).toBe('coil');
    if (calc.kind !== 'coil') return;
    expect(calc.calcLengthM).toBeCloseTo(1040.34, 2);
    expect(statusFor(calc)).toBe('accepted');
  });

  it('5. sheet within tolerance, stock reads back in square feet', () => {
    const calc = calcInward(sheet, { actualWeightKg: 3600, pieces: 200 });
    if (calc.kind !== 'standard') throw new Error('expected standard');
    expect(calc.theoreticalKg).toBeCloseTo(3617.28, 2);
    expect(calc.tolerancePct).toBeCloseTo(-0.48, 2);
    expect(statusFor(calc)).toBe('accepted');
    expect(Math.round(fromKg(3600, 'SQFT', sheet))).toBe(6170);
  });
});

describe('tolerance boundary', () => {
  it('accepts exactly +/-5% and rejects just beyond', () => {
    const theoretical = Number(pipe100.weight_per_piece) * 10;
    const at5 = calcInward(pipe100, { actualWeightKg: theoretical * 1.05, pieces: 10 });
    const past5 = calcInward(pipe100, { actualWeightKg: theoretical * 1.0501, pieces: 10 });
    expect(statusFor(at5)).toBe('accepted');
    expect(statusFor(past5)).toBe('pending_approval');
  });

  it('rejects non-positive weights and piece counts', () => {
    expect(() => calcInward(pipe100, { actualWeightKg: 0, pieces: 10 })).toThrow();
    expect(() => calcInward(pipe100, { actualWeightKg: 100, pieces: 0 })).toThrow();
    expect(() => calcInward(pipe100, { actualWeightKg: 100, pieces: 2.5 })).toThrow();
  });
});
