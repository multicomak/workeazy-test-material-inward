'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getMaterial } from '@/lib/data/materials';
import { decisionSchema, inwardSchema } from '@/lib/steel/schemas';
import { calcInward, isCoil, lengthMismatch, statusFor } from '@/lib/steel/inward';

export type CreateInwardResult =
  | { ok: true; id: string; mrn: string; status: 'accepted' | 'pending_approval' }
  | { ok: false; error: string; lengthMismatch?: { master: number; actual: number } };

/**
 * Until auth lands these are free text. See DECISIONS.md and TODO.md.
 */
const DEFAULT_OPERATOR = 'operator';
const DEFAULT_MANAGER = 'manager';

export async function createInward(raw: unknown): Promise<CreateInwardResult> {
  const parsed = inwardSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? 'Invalid entry' };
  }
  const input = parsed.data;

  const material = await getMaterial(input.material_id);
  if (!material) return { ok: false, error: 'Material not found.' };
  if (!material.is_active) return { ok: false, error: 'This material is inactive.' };

  const coil = isCoil(material);

  // Actual length is a verification field only: any difference is a different SKU.
  const mismatch = coil ? null : lengthMismatch(material, input.actual_length_m ?? null);
  if (mismatch) {
    return {
      ok: false,
      error: `Length differs from Master (${mismatch.master} m). Create a ${mismatch.actual} m SKU first.`,
      lengthMismatch: mismatch,
    };
  }

  let calc;
  try {
    calc = calcInward(material, {
      actualWeightKg: input.actual_weight_kg,
      pieces: input.pieces,
    });
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }

  const status = statusFor(calc);

  type InwardInsert = {
    material_id: string;
    supplier: string | null;
    vehicle_no: string | null;
    batch_no: string | null;
    actual_weight_kg: number;
    pieces: number;
    actual_length_m: number | null;
    theoretical_weight_kg: number | null;
    tolerance_kg: number | null;
    tolerance_pct: number | null;
    calc_length_m: number | null;
    status: 'accepted' | 'pending_approval';
    created_by: string;
  };

  const row: InwardInsert =
    calc.kind === 'coil'
      ? {
          material_id: material.id,
          supplier: input.supplier ?? null,
          vehicle_no: input.vehicle_no ?? null,
          batch_no: input.batch_no ?? null,
          actual_weight_kg: input.actual_weight_kg,
          pieces: input.pieces,
          actual_length_m: null,
          theoretical_weight_kg: null,
          tolerance_kg: null,
          tolerance_pct: null,
          calc_length_m: calc.calcLengthM,
          status,
          created_by: DEFAULT_OPERATOR,
        }
      : {
          material_id: material.id,
          supplier: input.supplier ?? null,
          vehicle_no: input.vehicle_no ?? null,
          batch_no: input.batch_no ?? null,
          actual_weight_kg: input.actual_weight_kg,
          pieces: input.pieces,
          actual_length_m: input.actual_length_m ?? null,
          theoretical_weight_kg: calc.theoreticalKg,
          tolerance_kg: calc.toleranceKg,
          tolerance_pct: calc.tolerancePct,
          calc_length_m: null,
          status,
          created_by: DEFAULT_OPERATOR,
        };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('inward_entries')
    .insert(row)
    .select('id, mrn_no')
    .single();

  if (error) return { ok: false, error: error.message };

  revalidatePath('/inward');
  revalidatePath('/materials');
  const inserted = data as { id: string; mrn_no: string };
  return { ok: true, id: inserted.id, mrn: inserted.mrn_no, status };
}

export type DecideResult = { ok: true } | { ok: false; error: string };

/** Approve or reject a pending entry. Both require a reason — see DECISIONS.md. */
export async function decideInward(raw: unknown): Promise<DecideResult> {
  const parsed = decisionSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid decision' };
  }
  const { id, decision, reason } = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('inward_entries')
    .update({
      status: decision === 'approve' ? 'approved' : 'rejected',
      approval_reason: reason,
      approved_by: DEFAULT_MANAGER,
      approved_at: new Date().toISOString(),
    })
    // Only a pending entry can be decided — a second click cannot flip a decision.
    .eq('id', id)
    .eq('status', 'pending_approval')
    .select('id')
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: 'This entry is no longer pending approval.' };

  revalidatePath('/inward');
  revalidatePath(`/inward/${id}`);
  revalidatePath('/materials');
  return { ok: true };
}
