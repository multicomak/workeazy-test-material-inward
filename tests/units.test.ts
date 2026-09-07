import { describe, expect, it } from 'vitest';
import { fromKg, toKg, supportedUnits, UnitError } from '@/lib/steel/units';
import { computeWeight } from '@/lib/steel/weight';
import { DI_CLASS_SEED, IS808_SEED } from '@/lib/steel/seedData';
import type { CategoryCode, Lookups, MaterialLike } from '@/lib/steel/types';

const lookups: Lookups = { is808: IS808_SEED, diClasses: DI_CLASS_SEED };

function material(category: CategoryCode, specs: Record<string, unknown>): MaterialLike {
  const w = computeWeight(category, specs, lookups);
  return {
    category,
    specs,
    weight_per_m: w.weightPerM,
    weight_per_piece: w.weightPerPiece,
  };
}

const pipe100 = material('pipe', { nb: 100, od: 100, thickness: 5, length: 6 });
const sheet = material('sheet', { width: 1200, thickness: 0.8, length: 2.4 });
const coil = material('coil', { width: 1200, thickness: 2.5 });

describe('fromKg', () => {
  it('converts pipe kg to metres', () => {
    expect(fromKg(690, 'M', pipe100)).toBeCloseTo(58.91, 2);
  });

  it('converts pipe kg to pieces', () => {
    expect(fromKg(702.81, 'NOS', pipe100)).toBeCloseTo(10, 6);
  });

  it('converts sheet kg to square feet', () => {
    // 3600 / (0.8 x 0.7293) = 3600 / 0.58344
    expect(fromKg(3600, 'SQFT', sheet)).toBeCloseTo(3600 / 0.58344, 6);
    expect(fromKg(3600, 'SQFT', sheet)).toBeCloseTo(6170.3, 1);
  });

  it('converts sheet kg to square metres', () => {
    expect(fromKg(3600, 'SQM', sheet)).toBeCloseTo(3600 / 6.28, 6);
  });

  it('converts coil kg to metres', () => {
    expect(fromKg(24500, 'M', coil)).toBeCloseTo(1040.34, 2);
  });

  it('KG is the identity', () => {
    expect(fromKg(690, 'KG', pipe100)).toBe(690);
  });

  it('throws for a unit the material does not support', () => {
    expect(() => fromKg(1, 'SQFT', pipe100)).toThrow(UnitError);
    expect(() => fromKg(1, 'SQM', pipe100)).toThrow(UnitError);
    expect(() => fromKg(1, 'NOS', coil)).toThrow(UnitError);
  });
});

describe('toKg', () => {
  it('round-trips every supported unit', () => {
    for (const m of [pipe100, sheet, coil]) {
      for (const unit of supportedUnits(m.category)) {
        if (unit === 'NOS' && m.weight_per_piece === null) continue;
        expect(toKg(fromKg(1000, unit, m), unit, m)).toBeCloseTo(1000, 6);
      }
    }
  });

  it('10 pieces of pipe is the theoretical weight', () => {
    expect(toKg(10, 'NOS', pipe100)).toBeCloseTo(702.81, 6);
  });
});
