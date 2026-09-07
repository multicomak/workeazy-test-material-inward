import Link from 'next/link';
import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState, PageHeader } from '@/components/page-header';
import { SetupNotice } from '@/components/setup-notice';
import { InwardFilters } from '@/components/inward/inward-filters';
import { StatusChip } from '@/components/inward/status-chip';
import { listInward } from '@/lib/data/inward';
import { isSupabaseConfigured } from '@/lib/supabase/server';
import { buildDisplayName } from '@/lib/steel/displayName';
import { fmt } from '@/lib/steel/num';
import type { InwardStatus } from '@/lib/steel/types';

export const dynamic = 'force-dynamic';

const VALID: InwardStatus[] = ['accepted', 'pending_approval', 'approved', 'rejected'];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: '2-digit',
  });
}

export default async function InwardPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const status = VALID.includes(params.status as InwardStatus)
    ? (params.status as InwardStatus)
    : undefined;

  const header = (
    <PageHeader
      title="Inward · MRN"
      subtitle="Goods received against an existing SKU. Pending approvals are listed first."
      actions={
        <Button asChild size="sm">
          <Link href="/inward/new">New inward</Link>
        </Button>
      }
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

  const entries = await listInward(status);

  return (
    <>
      {header}

      <div className="mb-3">
        <Suspense fallback={null}>
          <InwardFilters status={status} />
        </Suspense>
      </div>

      {entries.length === 0 ? (
        <EmptyState
          title={status ? 'Nothing with this status' : 'No inward entries yet'}
          description={
            status
              ? 'Clear the filter to see everything.'
              : 'Record the first goods receipt. Pick a SKU, enter the weighbridge weight and the piece count.'
          }
          action={
            status ? null : (
              <Button asChild size="sm">
                <Link href="/inward/new">New inward</Link>
              </Button>
            )
          }
        />
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>MRN</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Material</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead className="text-right">Actual KG</TableHead>
                <TableHead className="text-right">Pieces</TableHead>
                <TableHead className="text-right">Tolerance %</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => {
                const pct = entry.tolerance_pct;
                return (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">
                      <Link href={`/inward/${entry.id}`} className="hover:underline">
                        {entry.mrn_no}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(entry.created_at)}
                    </TableCell>
                    <TableCell>
                      {entry.materials ? buildDisplayName(entry.materials) : '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {entry.supplier ?? '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {entry.vehicle_no ?? '—'}
                    </TableCell>
                    <TableCell className="text-right">{fmt(entry.actual_weight_kg)}</TableCell>
                    <TableCell className="text-right">{fmt(entry.pieces, 0)}</TableCell>
                    <TableCell
                      className={
                        pct === null
                          ? 'text-right text-muted-foreground'
                          : Math.abs(Number(pct)) > 5
                            ? 'text-right text-amber-700 dark:text-amber-400'
                            : 'text-right'
                      }
                    >
                      {pct === null ? '—' : `${Number(pct) >= 0 ? '+' : ''}${fmt(pct)}`}
                    </TableCell>
                    <TableCell>
                      <StatusChip status={entry.status} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
