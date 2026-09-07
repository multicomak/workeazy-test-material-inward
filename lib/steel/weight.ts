/**
 * The one and only home of steel weight math.
 * Pure functions — safe to call from a server action and from a client form on
 * every keystroke. Nothing else in the app may compute a weight.
 */
import { PIPE_FACTOR, SOLID_FACTOR, SQFT_FACTOR, SQM_FACTOR } from './constants';
import { getCategory } from './categories';
import { normalizeNumber, toNumber } from './num';
import type {
  CategoryCode,
  Lookups,
  SectionType,
  WeightResult,
} from './types';

/** Thrown when a weight cannot be derived. `code` lets the UI pick its message. */
export class WeightError extends Error {
  readonly code: 'is808_missing' | 'invalid_spec';
  readonly detail?: string;

  constructor(code: WeightError['code'], message: string, detail?: string) {
    super(message);
    this.name = 'WeightError';
    this.code = code;
    this.detail = detail;
  }
}

export const EMPTY_LOOKUPS: Lookups = { is808: [], diClasses: [] };

/** DI wall-thickness fallback when the class table has no row for this OD. */
const DI_FALLBACK: Record<string, (od: number) => number> = {
  K7: (od) => od / 24 + 3,
  K9: (od) => od / 20 + 3,
  K12: (od) => od / 16 + 3,
};

/**
 * IS 808 angle designations are normalised to `{a}x{b}x{t}` with the longer leg first,
 * so 50x65x6 and 65x50x6 resolve to the same row.
 */
export function angleDesignation(
  legA: number,
  legB: number,
  thickness: number,
): string {
  const a = Math.max(legA, legB);
  const b = Math.min(legA, legB);
  return `${normalizeNumber(a)}x${normalizeNumber(b)}x${normalizeNumber(thickness)}`;
}

export function findIs808(
  lookups: Lookups,
  sectionType: SectionType,
  designation: string,
): number | null {
  const key = designation.trim().toLowerCase();
  const row = lookups.is808.find(
    (r) => r.section_type === sectionType && r.designation.trim().toLowerCase() === key,
  );
  return row ? Number(row.kg_per_m) : null;
}

export function findDiThickness(
  lookups: Lookups,
  od: number,
  cls: string,
): number | null {
  const row = lookups.diClasses.find(
    (r) => Number(r.od_mm) === od && r.class.trim().toUpperCase() === cls.trim().toUpperCase(),
  );
  return row ? Number(row.thickness_mm) : null;
}

/** Hollow round section: kg/m = (OD - t) x t x PIPE_FACTOR. */
export function pipeKgPerM(od: number, thickness: number): number {
  return (od - thickness) * thickness * PIPE_FACTOR;
}

/** Solid rectangular section: kg/m = width x t x SOLID_FACTOR. */
export function solidKgPerM(width: number, thickness: number): number {
  return width * thickness * SOLID_FACTOR;
}

/** Approximate angle weight, used only when IS 808 has no matching row. */
export function angleFormulaKgPerM(
  legA: number,
  legB: number,
  thickness: number,
): number {
  return (legA + legB - thickness) * thickness * SOLID_FACTOR;
}

/** Sheets only: kg per square foot at a given thickness. */
export function kgPerSqft(thicknessMm: number): number {
  return thicknessMm * SQFT_FACTOR;
}

/** Sheets only: kg per square metre at a given thickness. */
export function kgPerSqm(thicknessMm: number): number {
  return thicknessMm * SQM_FACTOR;
}

/**
 * Derive weight/m and weight/piece for a material.
 * Throws WeightError when a required IS 808 row is missing (there is deliberately
 * no manual weight entry anywhere in the app).
 */
export function computeWeight(
  category: CategoryCode,
  specs: Record<string, unknown>,
  lookups: Lookups = EMPTY_LOOKUPS,
): WeightResult {
  const def = getCategory(category);
  const length = def.hasLength ? toNumber(specs.length, 'length') : null;
  if (length !== null && length <= 0) {
    throw new WeightError('invalid_spec', 'Length must be greater than zero.');
  }

  const finish = (
    weightPerM: number,
    source: WeightResult['source'],
    extra: Omit<WeightResult, 'weightPerM' | 'weightPerPiece' | 'source'> = {},
  ): WeightResult => {
    if (!Number.isFinite(weightPerM) || weightPerM <= 0) {
      throw new WeightError('invalid_spec', 'Specs do not produce a positive weight.');
    }
    return {
      weightPerM,
      weightPerPiece: length === null ? null : weightPerM * length,
      source,
      ...extra,
    };
  };

  switch (def.weightMethod) {
    case 'pipe': {
      const od = toNumber(specs.od, 'od');
      const t = toNumber(specs.thickness, 'thickness');
      if (t >= od) {
        throw new WeightError('invalid_spec', 'Thickness must be less than OD.');
      }
      return finish(pipeKgPerM(od, t), 'formula');
    }

    case 'solid': {
      const width = toNumber(specs.width, 'width');
      const t = toNumber(specs.thickness, 'thickness');
      return finish(solidKgPerM(width, t), 'formula');
    }

    case 'is808': {
      const sectionType = def.sectionType;
      if (!sectionType) {
        throw new WeightError('invalid_spec', `Category ${category} has no IS 808 section type.`);
      }

      if (category === 'angle') {
        const legA = toNumber(specs.leg_a, 'leg_a');
        const legB = toNumber(specs.leg_b, 'leg_b');
        const t = toNumber(specs.thickness, 'thickness');
        const designation = angleDesignation(legA, legB, t);
        const kgPerM = findIs808(lookups, sectionType, designation);
        if (kgPerM !== null) {
          return finish(kgPerM, 'is808', { resolvedDesignation: designation });
        }
        // Documented fallback: approximate, badged as such in the UI.
        return finish(angleFormulaKgPerM(legA, legB, t), 'angle_formula', {
          resolvedDesignation: designation,
        });
      }

      const designation = String(specs.designation ?? '').trim();
      if (!designation) {
        throw new WeightError('invalid_spec', 'Designation is required.');
      }
      const kgPerM = findIs808(lookups, sectionType, designation);
      if (kgPerM === null) {
        throw new WeightError(
          'is808_missing',
          'Section not in IS 808 table. Add it under Settings → IS 808 first.',
          `${sectionType} ${designation}`,
        );
      }
      return finish(kgPerM, 'is808', { resolvedDesignation: designation });
    }

    case 'di_pipe': {
      const od = toNumber(specs.od, 'od');
      const cls = String(specs.class ?? '').trim().toUpperCase();
      const fallback = DI_FALLBACK[cls];
      if (!fallback) {
        throw new WeightError('invalid_spec', `Unknown DI class "${cls}".`);
      }
      // The table wins over the formula whenever a row exists.
      const tabled = findDiThickness(lookups, od, cls);
      const t = tabled ?? fallback(od);
      if (t >= od) {
        throw new WeightError('invalid_spec', 'Derived wall thickness exceeds OD.');
      }
      return finish(pipeKgPerM(od, t), tabled !== null ? 'di_table' : 'di_formula', {
        resolvedThicknessMm: t,
      });
    }

    default: {
      const exhaustive: never = def.weightMethod;
      throw new WeightError('invalid_spec', `Unhandled weight method: ${String(exhaustive)}`);
    }
  }
}

/** Non-throwing wrapper for live form preview. */
export function tryComputeWeight(
  category: CategoryCode,
  specs: Record<string, unknown>,
  lookups: Lookups = EMPTY_LOOKUPS,
): { ok: true; result: WeightResult } | { ok: false; error: WeightError } {
  try {
    return { ok: true, result: computeWeight(category, specs, lookups) };
  } catch (error) {
    if (error instanceof WeightError) return { ok: false, error };
    return {
      ok: false,
      error: new WeightError('invalid_spec', (error as Error).message || 'Invalid specs.'),
    };
  }
}

export const WEIGHT_SOURCE_LABEL: Record<WeightResult['source'], string> = {
  formula: 'Formula',
  is808: 'IS 808',
  angle_formula: 'Approximate',
  di_table: 'DI table',
  di_formula: 'Approximate',
};

export function isApproximate(source: WeightResult['source']): boolean {
  return source === 'angle_formula' || source === 'di_formula';
}
