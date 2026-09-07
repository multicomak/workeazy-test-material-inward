import { createClient } from '@/lib/supabase/server';
import type { CategoryCode, InwardStatus, Unit, WeightSource } from '@/lib/steel/types';

export type InwardMaterial = {
  id: string;
  category: CategoryCode;
  sub_category: string | null;
  grade: string | null;
  brand: string | null;
  specs: Record<string, unknown>;
  weight_per_m: number;
  weight_per_piece: number | null;
  weight_source: WeightSource;
  buy_units: Unit[];
  sell_units: Unit[];
};

export type InwardRow = {
  id: string;
  mrn_no: string;
  material_id: string;
  supplier: string | null;
  vehicle_no: string | null;
  batch_no: string | null;
  actual_weight_kg: number;
  pieces: number | null;
  actual_length_m: number | null;
  theoretical_weight_kg: number | null;
  tolerance_kg: number | null;
  tolerance_pct: number | null;
  calc_length_m: number | null;
  status: InwardStatus;
  approved_by: string | null;
  approval_reason: string | null;
  created_by: string | null;
  created_at: string;
  approved_at: string | null;
  materials: InwardMaterial | null;
};

const MATERIAL_EMBED =
  'materials!inner (id, category, sub_category, grade, brand, specs, weight_per_m, weight_per_piece, weight_source, buy_units, sell_units)';

const INWARD_COLUMNS = `id, mrn_no, material_id, supplier, vehicle_no, batch_no, actual_weight_kg, pieces, actual_length_m, theoretical_weight_kg, tolerance_kg, tolerance_pct, calc_length_m, status, approved_by, approval_reason, created_by, created_at, approved_at, ${MATERIAL_EMBED}`;

export async function listInward(status?: InwardStatus): Promise<InwardRow[]> {
  const supabase = await createClient();
  let query = supabase.from('inward_entries').select(INWARD_COLUMNS);
  if (status) query = query.eq('status', status);
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as unknown as InwardRow[];
  // Managers care about the queue first; everything else stays newest-first.
  return rows.sort((a, b) => {
    const aPending = a.status === 'pending_approval' ? 0 : 1;
    const bPending = b.status === 'pending_approval' ? 0 : 1;
    if (aPending !== bPending) return aPending - bPending;
    return b.created_at.localeCompare(a.created_at);
  });
}

export async function getInward(id: string): Promise<InwardRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('inward_entries')
    .select(INWARD_COLUMNS)
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as unknown as InwardRow | null) ?? null;
}

/** Active materials for the inward combobox. Inward may only pick an existing SKU. */
export async function listInwardMaterials(): Promise<InwardMaterial[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('materials')
    .select(
      'id, category, sub_category, grade, brand, specs, weight_per_m, weight_per_piece, weight_source, buy_units, sell_units',
    )
    .eq('is_active', true)
    .order('category');
  if (error) throw new Error(error.message);
  return (data ?? []) as InwardMaterial[];
}
