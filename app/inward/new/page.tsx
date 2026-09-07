import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { EmptyState, PageHeader } from '@/components/page-header';
import { SetupNotice } from '@/components/setup-notice';
import { InwardForm } from '@/components/inward/inward-form';
import { listInwardMaterials } from '@/lib/data/inward';
import { isSupabaseConfigured } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function NewInwardPage() {
  const header = (
    <PageHeader
      title="New inward entry"
      subtitle="Specs come from the master and cannot be edited here."
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

  const materials = await listInwardMaterials();

  return (
    <>
      {header}
      {materials.length === 0 ? (
        <EmptyState
          title="No active materials"
          description="Inward can only receive a SKU that already exists. Create one in the master first."
          action={
            <Button asChild size="sm">
              <Link href="/materials/new">Add material</Link>
            </Button>
          }
        />
      ) : (
        <InwardForm materials={materials} />
      )}
    </>
  );
}
