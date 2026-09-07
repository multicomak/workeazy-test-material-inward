/**
 * Canonical number formatting shared by spec_key, IS 808 designations and display names.
 * Trailing zeros are dropped so 5.0 and 5 are the same spec.
 */
export function normalizeNumber(value: number): string {
  if (!Number.isFinite(value)) throw new Error(`Not a finite number: ${value}`);
  // Guard against float noise before trimming (e.g. 0.30000000000000004).
  const fixed = Number(value.toFixed(6));
  return String(fixed);
}

/** Coerce unknown spec input to a finite number, or throw with the field name. */
export function toNumber(value: unknown, field: string): number {
  const n = typeof value === 'string' ? Number(value.trim()) : Number(value);
  if (typeof value === 'string' && value.trim() === '') {
    throw new Error(`Missing value for "${field}"`);
  }
  if (value === null || value === undefined || !Number.isFinite(n)) {
    throw new Error(`Missing or invalid value for "${field}"`);
  }
  return n;
}

/** Display rounding. Never used before persisting — the DB keeps full precision. */
export function round(value: number, dp = 2): number {
  const f = 10 ** dp;
  return Math.round((value + Number.EPSILON) * f) / f;
}

export function fmt(value: number | null | undefined, dp = 2): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  return round(value, dp).toLocaleString('en-IN', {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  });
}
