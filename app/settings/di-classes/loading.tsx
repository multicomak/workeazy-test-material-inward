import { PageHeader } from '@/components/page-header';
import { TableSkeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <>
      <PageHeader title="DI pipe classes" subtitle="Loading…" />
      <TableSkeleton columns={4} rows={4} />
    </>
  );
}
