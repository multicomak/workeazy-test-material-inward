import { PageHeader } from '@/components/page-header';
import { FormSkeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <>
      <PageHeader title="Inward entry" subtitle="Loading…" />
      <FormSkeleton />
    </>
  );
}
