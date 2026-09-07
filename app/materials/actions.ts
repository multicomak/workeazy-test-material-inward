'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getLookups } from '@/lib/data/lookups';
import { findMaterialBySpecKey, getMaterial } from '@/lib/data/materials';
import { parseMaterialInput } from '@/lib/steel/schemas';
import { buildSpecKey, canonicalSpecs } from '@/lib/steel/specKey';
import { computeWeight, WeightError } from '@/lib/steel/weight';

export type SaveMaterialResult =
  | { ok: true; id: string }
  | { ok: false; error: string; duplicateId?: string };

const UNIQUE_VIOLATION = '23505';

/**
 * Single entry point for creating and editing a material.
 * Weight is always recomputed here — the client never sends one.
 */
export async function saveMaterial(
  raw: unknown,
  materialId?: string,
): Promise<SaveMaterialResult> {
  const parsed = parseMaterialInput(raw);
  if (!parsed.success) return { ok: false, error: parsed.error };
  const input = parsed.data;

  if (materialId) {
    // Category is locked after creation: it decides the spec schema and the weight
    // method, so changing it would silently redefine an existing SKU.
    const existing = await getMaterial(materialId);
    if (!existing) return { ok: false, error: 'Material not found.' };
    if (existing.category !== input.category) {
      return { ok: false, error: 'A material\u2019s category cannot be changed.' };
    }
  }

  const specs = canonicalSpecs(input.category, input.specs);
  const specKey = buildSpecKey(input.category, specs);

  let weight;
  try {
    weight = computeWeight(input.category, specs, await getLookups());
  } catch (error) {
    if (error instanceof WeightError) return { ok: false, error: error.message };
    throw error;
  }

  const row = {
    category: input.category,
    sub_category: input.sub_category ?? null,
    grade: input.grade ?? null,
    hsn_code: input.hsn_code ?? null,
    manufacturer: input.manufacturer ?? null,
    brand: input.brand ?? null,
    specs,
    spec_key: specKey,
    weight_per_m: weight.weightPerM,
    weight_per_piece: weight.weightPerPiece,
    weight_source: weight.source,
    buy_units: input.buy_units,
    sell_units: input.sell_units,
    is_active: input.is_active,
  };

  const supabase = await createClient();
  const query = materialId
    ? supabase.from('materials').update({ ...row, updated_at: new Date().toISOString() }).eq('id', materialId)
    : supabase.from('materials').insert(row);

  const { data, error } = await query.select('id').single();

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      // Surface the clash as a form error with a link, never a 500.
      const existing = await findMaterialBySpecKey(specKey);
      return {
        ok: false,
        error: 'This exact SKU already exists',
        duplicateId: existing?.id,
      };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath('/materials');
  revalidatePath('/inward/new');
  if (materialId) revalidatePath(`/materials/${materialId}`);
  return { ok: true, id: (data as { id: string }).id };
}

export async function setMaterialActive(id: string, isActive: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('materials')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath('/materials');
  return { ok: true as const };
}
