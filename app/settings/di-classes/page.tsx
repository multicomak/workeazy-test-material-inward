import { PageHeader } from '@/components/page-header';
import { SetupNotice } from '@/components/setup-notice';
import { DiClassesTable } from '@/components/settings/di-classes-table';
import { getLookups } from '@/lib/data/lookups';
import { isSupabaseConfigured } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function DiClassesSettingsPage() {
  const header = (
    <PageHeader
      title="DI pipe classes"
      subtitle="Wall thickness by OD and class. A row here wins over the class formula. Verify against IS 8329."
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
  const rows = [...lookups.diClasses].sort(
    (a, b) => Number(a.od_mm) - Number(b.od_mm) || a.class.localeCompare(b.class),
  );

  return (
    <>
      {header}
      <DiClassesTable rows={rows} />
    </>
  );
}
