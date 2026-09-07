import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { SetupNotice } from '@/components/setup-notice';
import { MaterialForm, type MaterialFormValues } from '@/components/materials/material-form';
import { designationsByType, getLookups } from '@/lib/data/lookups';
import { getMaterial } from '@/lib/data/materials';
import { isSupabaseConfigured } from '@/lib/supabase/server';
import { getCategory } from '@/lib/steel/categories';
import { buildDisplayName } from '@/lib/steel/displayName';
import type { Unit } from '@/lib/steel/types';

export const dynamic = 'force-dynamic';

export default async function EditMaterialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!isSupabaseConfigured()) {
    return (
      <>
        <PageHeader title="Material" />
        <SetupNotice />
      </>
    );
  }

  const material = await getMaterial(id);
  if (!material) notFound();

  const def = getCategory(material.category);
  const initial: MaterialFormValues = {
    id: material.id,
    category: material.category,
    sub_category: material.sub_category ?? '',
    grade: material.grade ?? '',
    hsn_code: material.hsn_code ?? '',
    manufacturer: material.manufacturer ?? '',
    brand: material.brand ?? '',
    is_active: material.is_active,
    specs: Object.fromEntries(
      def.fields.map((f) => [f.name, String(material.specs[f.name] ?? '')]),
    ),
    buy_units: (material.buy_units ?? []) as Unit[],
    sell_units: (material.sell_units ?? []) as Unit[],
  };

  const lookups = await getLookups();

  return (
    <>
      <PageHeader
        title={buildDisplayName(material)}
        subtitle={`${def.label} · ${material.spec_key}`}
      />
      <MaterialForm
        mode="edit"
        lookups={lookups}
        designations={designationsByType(lookups)}
        initial={initial}
      />
    </>
  );
}
