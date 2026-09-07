import { PageHeader } from '@/components/page-header';
import { SetupNotice } from '@/components/setup-notice';
import { Is808Table } from '@/components/settings/is808-table';
import { getLookups } from '@/lib/data/lookups';
import { isSupabaseConfigured } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function Is808SettingsPage() {
  const header = (
    <PageHeader
      title="IS 808 sections"
      subtitle="Rolled-section weights. This and the DI class table are the only places a reference weight can be changed."
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
  const rows = [...lookups.is808].sort(
    (a, b) =>
      a.section_type.localeCompare(b.section_type) ||
      (Number(a.designation) || 0) - (Number(b.designation) || 0) ||
      a.designation.localeCompare(b.designation),
  );

  return (
    <>
      {header}
      <Is808Table rows={rows} />
    </>
  );
}
