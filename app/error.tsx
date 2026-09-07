'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Most failures reaching here are a missing table or an RLS policy blocking the
 * read — worth saying so plainly rather than showing a blank screen.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Card className="border-destructive/40">
      <CardHeader>
        <CardTitle className="text-destructive">Something went wrong</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        <p className="font-mono text-sm">{error.message}</p>
        <p className="text-sm text-muted-foreground">
          If this is the first run, check that the migrations in{' '}
          <code className="font-mono">supabase/migrations/</code> have been applied and that the
          Supabase URL and anon key are set.
        </p>
        <div>
          <Button size="sm" onClick={reset}>
            Try again
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
