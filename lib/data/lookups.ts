import { createClient } from '@/lib/supabase/server';
import type { DiPipeClassRow, Is808Row, Lookups } from '@/lib/steel/types';

/**
 * The reference tables are small and change rarely, so every screen that needs a
 * weight loads both in one round trip.
 */
export async function getLookups(): Promise<Lookups> {
  const supabase = await createClient();
  const [is808, diClasses] = await Promise.all([
    supabase.from('is808_sections').select('section_type, designation, kg_per_m'),
    supabase.from('di_pipe_classes').select('od_mm, class, thickness_mm'),
  ]);

  if (is808.error) throw new Error(is808.error.message);
  if (diClasses.error) throw new Error(diClasses.error.message);

  return {
    is808: (is808.data ?? []) as Is808Row[],
    diClasses: (diClasses.data ?? []) as DiPipeClassRow[],
  };
}

/** Designations available per section type, for the material form's select. */
export function designationsByType(lookups: Lookups) {
  const map: Record<string, string[]> = {};
  for (const row of lookups.is808) {
    (map[row.section_type] ??= []).push(row.designation);
  }
  for (const key of Object.keys(map)) {
    map[key]!.sort((a, b) => {
      const na = Number(a);
      const nb = Number(b);
      if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
      return a.localeCompare(b);
    });
  }
  return map;
}
