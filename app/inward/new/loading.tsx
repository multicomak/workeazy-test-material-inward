import { PageHeader } from '@/components/page-header';
import { FormSkeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <>
      <PageHeader title="New inward entry" subtitle="Loading…" />
      <FormSkeleton />
    </>
  );
}
