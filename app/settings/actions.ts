'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { diClassSchema, is808Schema } from '@/lib/steel/schemas';

export type SettingsResult = { ok: true } | { ok: false; error: string };

function fail(message: string): SettingsResult {
  return { ok: false, error: message };
}

/** Reference weights may only change here — nowhere else in the app. */
export async function upsertIs808Section(raw: unknown): Promise<SettingsResult> {
  const parsed = is808Schema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Invalid section');

  const supabase = await createClient();
  const { error } = await supabase.from('is808_sections').upsert(parsed.data, {
    onConflict: 'section_type,designation',
  });
  if (error) return fail(error.message);

  revalidateWeightConsumers('/settings/is808');
  return { ok: true };
}

export async function deleteIs808Section(
  sectionType: string,
  designation: string,
): Promise<SettingsResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('is808_sections')
    .delete()
    .eq('section_type', sectionType)
    .eq('designation', designation);
  if (error) return fail(error.message);

  revalidateWeightConsumers('/settings/is808');
  return { ok: true };
}

export async function upsertDiClass(raw: unknown): Promise<SettingsResult> {
  const parsed = diClassSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Invalid row');

  const supabase = await createClient();
  const { error } = await supabase
    .from('di_pipe_classes')
    .upsert(parsed.data, { onConflict: 'od_mm,class' });
  if (error) return fail(error.message);

  revalidateWeightConsumers('/settings/di-classes');
  return { ok: true };
}

export async function deleteDiClass(odMm: number, cls: string): Promise<SettingsResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('di_pipe_classes')
    .delete()
    .eq('od_mm', odMm)
    .eq('class', cls);
  if (error) return fail(error.message);

  revalidateWeightConsumers('/settings/di-classes');
  return { ok: true };
}

/**
 * Changing a reference weight does not retro-fit existing materials — their
 * persisted weight is recomputed the next time they are saved. New materials
 * pick the change up immediately.
 */
function revalidateWeightConsumers(path: string) {
  revalidatePath(path);
  revalidatePath('/materials/new');
  revalidatePath('/materials');
}
