/**
 * KG is the base stock unit. Everything else is derived per SKU at read time.
 */
import { getCategory } from './categories';
import { kgPerSqft, kgPerSqm } from './weight';
import { toNumber } from './num';
import type { CategoryCode, MaterialLike, Unit } from './types';

export const ALL_UNITS: readonly Unit[] = ['KG', 'M', 'NOS', 'SQFT', 'SQM'];

export const UNIT_LABEL: Record<Unit, string> = {
  KG: 'kg',
  M: 'm',
  NOS: 'nos',
  SQFT: 'sq ft',
  SQM: 'sq m',
};

export class UnitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnitError';
  }
}

export function isUnit(value: unknown): value is Unit {
  return typeof value === 'string' && (ALL_UNITS as readonly string[]).includes(value);
}

/** Every unit the category can physically be expressed in (buy set ∪ sell set). */
export function supportedUnits(category: CategoryCode): Unit[] {
  const def = getCategory(category);
  const set = new Set<Unit>([...def.buyUnits, ...def.sellUnits]);
  return ALL_UNITS.filter((u) => set.has(u));
}

export function supportsUnit(category: CategoryCode, unit: Unit): boolean {
  return supportedUnits(category).includes(unit);
}

/**
 * kg per one of `unit` for this material. This is the only conversion table;
 * fromKg / toKg are its two directions.
 */
function kgPerUnit(unit: Unit, material: MaterialLike): number {
  const { category, specs } = material;
  if (!supportsUnit(category, unit)) {
    throw new UnitError(
      `${getCategory(category).label} does not support ${unit}.`,
    );
  }

  switch (unit) {
    case 'KG':
      return 1;
    case 'M': {
      const perM = Number(material.weight_per_m);
      if (!Number.isFinite(perM) || perM <= 0) {
        throw new UnitError('Material has no weight per metre.');
      }
      return perM;
    }
    case 'NOS': {
      const perPc = material.weight_per_piece;
      if (perPc === null || perPc === undefined || !Number.isFinite(Number(perPc)) || Number(perPc) <= 0) {
        throw new UnitError('Material has no weight per piece.');
      }
      return Number(perPc);
    }
    case 'SQFT':
      return kgPerSqft(toNumber(specs.thickness, 'thickness'));
    case 'SQM':
      return kgPerSqm(toNumber(specs.thickness, 'thickness'));
    default: {
      const exhaustive: never = unit;
      throw new UnitError(`Unknown unit: ${String(exhaustive)}`);
    }
  }
}

/** Convert a KG stock figure into the requested unit. */
export function fromKg(kg: number, unit: Unit, material: MaterialLike): number {
  return kg / kgPerUnit(unit, material);
}

/** Convert a quantity in the given unit back to KG. */
export function toKg(qty: number, unit: Unit, material: MaterialLike): number {
  return qty * kgPerUnit(unit, material);
}

/** Non-throwing variant for list cells where an unsupported unit just renders as "—". */
export function tryFromKg(
  kg: number,
  unit: Unit,
  material: MaterialLike,
): number | null {
  try {
    return fromKg(kg, unit, material);
  } catch {
    return null;
  }
}
