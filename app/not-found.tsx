import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/page-header';

export default function NotFound() {
  return (
    <EmptyState
      title="Not found"
      description="That record does not exist, or it has been removed."
      action={
        <Button asChild size="sm">
          <Link href="/materials">Back to materials</Link>
        </Button>
      }
    />
  );
}
