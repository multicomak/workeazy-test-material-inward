import { PageHeader } from '@/components/page-header';
import { TableSkeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <>
      <PageHeader title="Material master" subtitle="Loading…" />
      <TableSkeleton columns={9} />
    </>
  );
}
