import { createClient } from '@/lib/supabase/server';
import type { CategoryCode, Unit, WeightSource } from '@/lib/steel/types';

export type MaterialRow = {
  id: string;
  category: CategoryCode;
  sub_category: string | null;
  grade: string | null;
  hsn_code: string | null;
  manufacturer: string | null;
  brand: string | null;
  specs: Record<string, unknown>;
  spec_key: string;
  weight_per_m: number;
  weight_per_piece: number | null;
  weight_source: WeightSource;
  buy_units: Unit[];
  sell_units: Unit[];
  is_active: boolean;
  created_at: string;
};

export type StockRow = {
  material_id: string;
  stock_kg: number;
  stock_pcs: number | null;
  stock_m: number;
};

const MATERIAL_COLUMNS =
  'id, category, sub_category, grade, hsn_code, manufacturer, brand, specs, spec_key, weight_per_m, weight_per_piece, weight_source, buy_units, sell_units, is_active, created_at';

export async function listMaterials(): Promise<MaterialRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('materials')
    .select(MATERIAL_COLUMNS)
    .order('category')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as MaterialRow[];
}

export async function getMaterial(id: string): Promise<MaterialRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('materials')
    .select(MATERIAL_COLUMNS)
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as MaterialRow | null) ?? null;
}

export async function findMaterialBySpecKey(specKey: string): Promise<MaterialRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('materials')
    .select(MATERIAL_COLUMNS)
    .eq('spec_key', specKey)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as MaterialRow | null) ?? null;
}

/** Stock is KG-based; every other unit is derived per SKU at read time. */
export async function getStock(): Promise<Map<string, StockRow>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('stock_by_material')
    .select('material_id, stock_kg, stock_pcs, stock_m');
  if (error) throw new Error(error.message);
  return new Map((data ?? []).map((row) => [(row as StockRow).material_id, row as StockRow]));
}
