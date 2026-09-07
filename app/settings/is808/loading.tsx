import { PageHeader } from '@/components/page-header';
import { TableSkeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <>
      <PageHeader title="IS 808 sections" subtitle="Loading…" />
      <TableSkeleton columns={4} rows={10} />
    </>
  );
}
