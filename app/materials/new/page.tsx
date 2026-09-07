import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { SetupNotice } from '@/components/setup-notice';
import { MaterialForm, type MaterialFormValues } from '@/components/materials/material-form';
import { designationsByType, getLookups } from '@/lib/data/lookups';
import { isSupabaseConfigured } from '@/lib/supabase/server';
import { getCategory, isCategoryCode } from '@/lib/steel/categories';
import type { CategoryCode } from '@/lib/steel/types';

export const dynamic = 'force-dynamic';

function blankValues(category: CategoryCode): MaterialFormValues {
  const def = getCategory(category);
  return {
    category,
    sub_category: '',
    grade: '',
    hsn_code: '',
    manufacturer: '',
    brand: '',
    is_active: true,
    specs: Object.fromEntries(def.fields.map((f) => [f.name, ''])),
    buy_units: [...def.defaultBuyUnits],
    sell_units: [...def.defaultSellUnits],
  };
}

export default async function NewMaterialPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  if (params.category && !isCategoryCode(params.category)) notFound();
  // Inward links here pre-filled with the category the operator was looking for.
  const category: CategoryCode = isCategoryCode(params.category) ? params.category : 'pipe';

  const header = (
    <PageHeader
      title="New material"
      subtitle="Specs define the SKU. Weight is derived — there is no weight field."
    />
  );

  if (!isSupabaseConfigured()) {
    return (
      <>
        {header}
        <SetupNotice />
      </>
    );
  }

  const lookups = await getLookups();

  return (
    <>
      {header}
      <MaterialForm
        mode="create"
        lookups={lookups}
        designations={designationsByType(lookups)}
        initial={blankValues(category)}
      />
    </>
  );
}
