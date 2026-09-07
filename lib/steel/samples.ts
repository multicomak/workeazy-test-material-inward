/**
 * One demo material per category (Appendix A). Used by the dev seed and by the
 * tests that prove the weight engine reproduces the spec's worked examples.
 */
import type { CategoryCode, Unit, WeightSource } from './types';
import { CATEGORIES } from './categories';

export type SampleMaterial = {
  category: CategoryCode;
  specs: Record<string, number | string>;
  sub_category?: string;
  grade?: string;
  brand?: string;
  expectedWeightPerM: number;
  expectedWeightPerPiece: number | null;
  expectedSource: WeightSource;
};

export const SAMPLE_MATERIALS: SampleMaterial[] = [
  {
    category: 'pipe',
    specs: { nb: 100, od: 100, thickness: 5, length: 6 },
    grade: 'GI Z275',
    expectedWeightPerM: 11.7135,
    expectedWeightPerPiece: 70.281,
    expectedSource: 'formula',
  },
  {
    category: 'angle',
    specs: { leg_a: 50, leg_b: 50, thickness: 6, length: 6 },
    grade: 'MS',
    expectedWeightPerM: 4.47,
    expectedWeightPerPiece: 26.82,
    expectedSource: 'is808',
  },
  {
    category: 'channel',
    specs: { designation: '100', length: 6 },
    grade: 'MS',
    expectedWeightPerM: 9.56,
    expectedWeightPerPiece: 57.36,
    expectedSource: 'is808',
  },
  {
    category: 'ibeam',
    specs: { designation: '200', length: 6 },
    grade: 'MS',
    expectedWeightPerM: 25.4,
    expectedWeightPerPiece: 152.4,
    expectedSource: 'is808',
  },
  {
    category: 'hbeam',
    specs: { designation: '300', length: 6 },
    grade: 'MS',
    expectedWeightPerM: 56.8,
    expectedWeightPerPiece: 340.8,
    expectedSource: 'is808',
  },
  {
    category: 'rod',
    specs: { width: 50, thickness: 10, length: 6 },
    sub_category: 'Flat',
    grade: 'MS',
    expectedWeightPerM: 3.925,
    expectedWeightPerPiece: 23.55,
    expectedSource: 'formula',
  },
  {
    category: 'sheet',
    specs: { width: 1200, thickness: 0.8, length: 2.4 },
    sub_category: 'PPGI',
    grade: 'Z275',
    expectedWeightPerM: 7.536,
    expectedWeightPerPiece: 18.0864,
    expectedSource: 'formula',
  },
  {
    category: 'di_pipe',
    specs: { od: 200, class: 'K9', length: 6 },
    grade: 'DI K9',
    expectedWeightPerM: 49.067235,
    expectedWeightPerPiece: 294.4,
    expectedSource: 'di_table',
  },
  {
    category: 'coil',
    specs: { width: 1200, thickness: 2.5 },
    sub_category: 'HR',
    grade: 'IS 2062',
    expectedWeightPerM: 23.55,
    expectedWeightPerPiece: null,
    expectedSource: 'formula',
  },
];

export function sampleUnits(category: CategoryCode): { buy: Unit[]; sell: Unit[] } {
  const def = CATEGORIES[category];
  return { buy: [...def.defaultBuyUnits], sell: [...def.defaultSellUnits] };
}
