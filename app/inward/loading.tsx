import { PageHeader } from '@/components/page-header';
import { TableSkeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <>
      <PageHeader title="Inward · MRN" subtitle="Loading…" />
      <TableSkeleton columns={9} />
    </>
  );
}
