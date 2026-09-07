/**
 * The single place a material's canonical identity string is built.
 * The Postgres unique constraint on materials.spec_key relies on this being
 * deterministic: sorted field names, numbers normalised (5.0 -> 5), strings lowercased.
 *
 * Example: "pipe|length=6|nb=100|od=101.6|thickness=5"
 */
import { getCategory } from './categories';
import { normalizeNumber } from './num';
import type { CategoryCode } from './types';

function normalizeValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') return normalizeNumber(value);
  if (typeof value === 'boolean') return String(value);
  const s = String(value).trim();
  if (s === '') return '';
  // Numeric-looking strings normalise as numbers so "5.0" === 5.
  const n = Number(s);
  if (Number.isFinite(n) && /^[+-]?(\d+\.?\d*|\.\d+)$/.test(s)) return normalizeNumber(n);
  return s.toLowerCase();
}

/**
 * Build the canonical spec key. Only fields declared by the category take part,
 * so stray keys in the specs object can never fork a SKU.
 */
export function buildSpecKey(
  category: CategoryCode,
  specs: Record<string, unknown>,
): string {
  const def = getCategory(category);
  const parts = def.fields
    .map((field) => field.name)
    .sort()
    .map((name) => `${name}=${normalizeValue(specs[name])}`);
  return [category, ...parts].join('|');
}

/** Strip specs down to exactly the category's declared fields, numbers as numbers. */
export function canonicalSpecs(
  category: CategoryCode,
  specs: Record<string, unknown>,
): Record<string, number | string> {
  const def = getCategory(category);
  const out: Record<string, number | string> = {};
  for (const field of def.fields) {
    const raw = specs[field.name];
    if (field.kind === 'number') {
      out[field.name] = Number(raw);
    } else {
      out[field.name] = String(raw ?? '').trim();
    }
  }
  return out;
}
