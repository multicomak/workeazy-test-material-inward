'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { decideInward } from '@/app/inward/actions';

const MIN_REASON = 10;

/**
 * A pending entry is not stock until someone decides on it, with a reason.
 * There is no role check yet — see DECISIONS.md.
 */
export function ApprovalPanel({ id }: { id: string }) {
  const router = useRouter();
  const [reason, setReason] = React.useState('');
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const tooShort = reason.trim().length < MIN_REASON;

  async function decide(decision: 'approve' | 'reject') {
    setPending(true);
    setError(null);
    try {
      const result = await decideInward({ id, decision, reason });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success(decision === 'approve' ? 'Entry approved — now in stock' : 'Entry rejected');
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="border-amber-600/40">
      <CardHeader>
        <CardTitle className="text-amber-700 dark:text-amber-400">Manager decision</CardTitle>
        <p className="text-xs text-[--muted-foreground]">
          This entry is outside tolerance and is not counted as stock until it is approved.
        </p>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div className="grid gap-1">
          <Label htmlFor="approval-reason">Reason (required, min {MIN_REASON} characters)</Label>
          <Textarea
            id="approval-reason"
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setError(null);
            }}
            placeholder="e.g. Weighbridge slip verified against supplier invoice; short weight accepted."
          />
          <span className="text-[11px] text-[--muted-foreground]">
            {reason.trim().length}/{MIN_REASON}
          </span>
        </div>

        {error ? <p className="text-sm text-[--destructive]">{error}</p> : null}

        <div className="flex gap-2">
          <Button disabled={pending || tooShort} onClick={() => decide('approve')}>
            Approve
          </Button>
          <Button
            variant="destructive"
            disabled={pending || tooShort}
            onClick={() => decide('reject')}
          >
            Reject
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
