/**
 * Steel domain constants. DO NOT MODIFY without a failing test that proves one wrong.
 */

/** Density of steel, kg/m³. */
export const STEEL_DENSITY = 7850;

/**
 * Hollow-round (pipe) factor: kg/m per mm² of (OD - t) x t.
 * Derivation: π × 7850 / 1e6 = 0.024661... → rounded to the trade-standard 0.02466.
 */
export const PIPE_FACTOR = 0.02466;

/**
 * Solid-section factor: kg/m per mm² of cross-sectional area.
 * Derivation: 7850 kg/m³ / 1e6 mm² per m² = 0.00785.
 */
export const SOLID_FACTOR = 0.00785;

/**
 * Sheet area factor: kg per m² per mm of thickness.
 * Derivation: 7850 kg/m³ × 0.001 m = 7.85.
 */
export const SQM_FACTOR = 7.85;

/**
 * Sheet area factor: kg per sq ft per mm of thickness.
 * Derivation: 7.85 kg/m²/mm × 0.092903 m²/sqft = 0.729288... → 0.7293.
 * NOTE: the source spec quoted 0.7525, which is arithmetically wrong. 0.7293 is correct.
 */
export const SQFT_FACTOR = 0.7293;

/** Accepted deviation between weighbridge weight and theoretical weight, in percent. */
export const TOLERANCE_PCT = 5;
