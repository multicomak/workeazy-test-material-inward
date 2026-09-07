/**
 * Inward (MRN) derivations. No weight formulas live here — this only combines
 * the persisted per-SKU weights with what the weighbridge reported.
 */
import { TOLERANCE_PCT } from './constants';
import type { MaterialLike } from './types';

export type CoilCalc = {
  kind: 'coil';
  weightPerM: number;
  /** Coils have no master length: it is derived from actual weight. */
  calcLengthM: number;
};

export type StandardCalc = {
  kind: 'standard';
  weightPerPiece: number;
  theoreticalKg: number;
  /** actual − theoretical, kg. Negative means short-received. */
  toleranceKg: number;
  tolerancePct: number;
  withinTolerance: boolean;
};

export type InwardCalc = CoilCalc | StandardCalc;

export function isCoil(material: Pick<MaterialLike, 'category'>): boolean {
  return material.category === 'coil';
}

export function calcInward(
  material: MaterialLike,
  input: { actualWeightKg: number; pieces: number },
): InwardCalc {
  const actual = Number(input.actualWeightKg);
  if (!Number.isFinite(actual) || actual <= 0) {
    throw new Error('Actual weight must be greater than zero.');
  }

  if (isCoil(material)) {
    const perM = Number(material.weight_per_m);
    if (!Number.isFinite(perM) || perM <= 0) {
      throw new Error('Coil master has no weight per metre.');
    }
    // Coils are the documented exception: length is derived, never checked.
    return { kind: 'coil', weightPerM: perM, calcLengthM: actual / perM };
  }

  const perPc = Number(material.weight_per_piece);
  if (!Number.isFinite(perPc) || perPc <= 0) {
    throw new Error('Material has no weight per piece.');
  }
  const pieces = Number(input.pieces);
  if (!Number.isInteger(pieces) || pieces <= 0) {
    throw new Error('Number of pieces must be a positive whole number.');
  }

  const theoreticalKg = perPc * pieces;
  const toleranceKg = actual - theoreticalKg;
  const tolerancePct = (toleranceKg / theoreticalKg) * 100;

  return {
    kind: 'standard',
    weightPerPiece: perPc,
    theoreticalKg,
    toleranceKg,
    tolerancePct,
    // Epsilon so an exactly-on-the-limit reading is not flipped by float noise.
    withinTolerance: Math.abs(tolerancePct) <= TOLERANCE_PCT + 1e-9,
  };
}

/** Coils always accept; everything else accepts only inside ±TOLERANCE_PCT. */
export function statusFor(calc: InwardCalc): 'accepted' | 'pending_approval' {
  if (calc.kind === 'coil') return 'accepted';
  return calc.withinTolerance ? 'accepted' : 'pending_approval';
}

/**
 * Master length for a non-coil SKU, used by the inward length-mismatch guard.
 * Any difference is a different SKU by definition — inward may never widen a spec.
 */
export function masterLength(material: MaterialLike): number | null {
  if (isCoil(material)) return null;
  const len = Number(material.specs.length);
  return Number.isFinite(len) ? len : null;
}

export function lengthMismatch(
  material: MaterialLike,
  actualLengthM: number | null | undefined,
): { master: number; actual: number } | null {
  if (actualLengthM === null || actualLengthM === undefined) return null;
  const actual = Number(actualLengthM);
  if (!Number.isFinite(actual) || actual <= 0) return null;
  const master = masterLength(material);
  if (master === null) return null;
  // Compare at the same precision the master is stored/displayed at.
  if (Math.abs(master - actual) < 1e-6) return null;
  return { master, actual };
}
