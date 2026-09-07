/**
 * Deterministic per-category material names. Used in lists, comboboxes and
 * the inward read-only spec grid, so it must never depend on DB state.
 */
import { getCategory } from './categories';
import { normalizeNumber } from './num';
import type { CategoryCode, MaterialLike } from './types';

function n(value: unknown): string {
  const v = Number(value);
  return Number.isFinite(v) ? normalizeNumber(v) : String(value ?? '?');
}

function s(value: unknown): string {
  const v = String(value ?? '').trim();
  return v;
}

export function buildDisplayName(material: {
  category: CategoryCode;
  specs: Record<string, unknown>;
  sub_category?: string | null;
  grade?: string | null;
}): string {
  const { category, specs } = material;
  const sub = s(material.sub_category);
  const grade = s(material.grade);
  const label = getCategory(category).label;

  switch (category) {
    case 'pipe':
      return `${grade || 'Pipe'} · NB${n(specs.nb)} OD${n(specs.od)} × t${n(specs.thickness)} × ${n(specs.length)}m`;
    case 'angle':
      return `Angle ${n(specs.leg_a)}×${n(specs.leg_b)}×${n(specs.thickness)} × ${n(specs.length)}m`;
    case 'channel':
      return `ISMC ${s(specs.designation)} × ${n(specs.length)}m`;
    case 'ibeam':
      return `ISMB ${s(specs.designation)} × ${n(specs.length)}m`;
    case 'hbeam':
      return `ISWB ${s(specs.designation)} × ${n(specs.length)}m`;
    case 'rod':
    case 'sheet':
      return `${sub || label} ${n(specs.width)}×${n(specs.thickness)} × ${n(specs.length)}m`;
    case 'di_pipe':
      return `DI ${s(specs.class)} OD${n(specs.od)} × ${n(specs.length)}m`;
    case 'coil':
      return `${sub || 'Coil'} ${n(specs.width)}×${n(specs.thickness)}`;
    default: {
      const exhaustive: never = category;
      return String(exhaustive);
    }
  }
}

export function displayNameOf(material: MaterialLike): string {
  return buildDisplayName(material);
}
