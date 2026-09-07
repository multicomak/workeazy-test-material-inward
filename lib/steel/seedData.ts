/**
 * Reference data as shipped in the initial migration. Kept in TS as well so the
 * weight engine can be unit-tested without a database.
 */
import type { DiPipeClassRow, Is808Row, SectionType } from './types';

function rows(section: SectionType, pairs: [string, number][]): Is808Row[] {
  return pairs.map(([designation, kg_per_m]) => ({
    section_type: section,
    designation,
    kg_per_m,
  }));
}

export const IS808_SEED: Is808Row[] = [
  ...rows('ISA', [
    ['20x20x3', 0.91],
    ['25x25x3', 1.12],
    ['25x25x5', 1.82],
    ['30x30x3', 1.37],
    ['35x35x5', 2.58],
    ['40x40x5', 2.98],
    ['45x45x5', 3.38],
    ['50x50x5', 3.78],
    ['50x50x6', 4.47],
    ['65x65x6', 5.86],
    ['75x75x6', 6.82],
    ['75x75x8', 8.96],
    ['90x90x6', 8.2],
    ['90x90x8', 10.8],
    ['100x100x6', 9.17],
    ['100x100x10', 14.9],
    ['150x150x12', 27.2],
    ['200x200x20', 60.8],
  ]),
  ...rows('ISMC', [
    ['75', 7.14],
    ['100', 9.56],
    ['125', 13.1],
    ['150', 16.2],
    ['175', 19.6],
    ['200', 22.3],
    ['225', 25.5],
    ['250', 31.1],
    ['300', 36.3],
    ['350', 42.1],
    ['400', 49.4],
  ]),
  ...rows('ISMB', [
    ['100', 10.4],
    ['125', 12.8],
    ['150', 15.0],
    ['175', 18.4],
    ['200', 25.4],
    ['225', 31.2],
    ['250', 37.3],
    ['300', 44.2],
    ['350', 52.4],
    ['400', 61.6],
    ['450', 72.4],
    ['500', 86.9],
  ]),
  ...rows('ISWB', [
    ['300', 56.8],
    ['350', 67.7],
    ['400', 82.2],
    ['450', 97.8],
    ['500', 117.0],
    ['600', 145.0],
  ]),
];

/**
 * Seeded sparsely on purpose: the class formula covers everything else.
 * TODO: verify these against IS 8329 before production use.
 */
export const DI_CLASS_SEED: DiPipeClassRow[] = [
  { od_mm: 200, class: 'K9', thickness_mm: 10.5 },
];
