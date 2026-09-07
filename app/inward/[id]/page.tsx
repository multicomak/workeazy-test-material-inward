import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';
import { SetupNotice } from '@/components/setup-notice';
import { ApprovalPanel } from '@/components/inward/approval-panel';
import { SpecGrid } from '@/components/inward/spec-grid';
import { StatusChip } from '@/components/inward/status-chip';
import { getInward } from '@/lib/data/inward';
import { isSupabaseConfigured } from '@/lib/supabase/server';
import { TOLERANCE_PCT } from '@/lib/steel/constants';
import { buildDisplayName } from '@/lib/steel/displayName';
import { fmt } from '@/lib/steel/num';

export const dynamic = 'force-dynamic';

export default async function InwardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!isSupabaseConfigured()) {
    return (
      <>
        <PageHeader title="Inward entry" />
        <SetupNotice />
      </>
    );
  }

  const entry = await getInward(id);
  if (!entry) notFound();

  const material = entry.materials;
  const coil = material?.category === 'coil';
  const inStock = entry.status === 'accepted' || entry.status === 'approved';

  return (
    <>
      <PageHeader
        title={entry.mrn_no}
        subtitle={material ? buildDisplayName(material) : undefined}
        actions={
          <>
            <StatusChip status={entry.status} />
            <Button asChild size="sm" variant="outline">
              <Link href="/inward">Back to list</Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid gap-4">
          {material ? <SpecGrid material={material} /> : null}

          <Card>
            <CardHeader>
              <CardTitle>Received</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
                <Item label="Actual weight" value={`${fmt(entry.actual_weight_kg)} kg`} />
                <Item
                  label={coil ? 'No. of coils' : 'No. of pieces'}
                  value={fmt(entry.pieces, 0)}
                />
                {!coil ? (
                  <Item
                    label="Actual length"
                    value={entry.actual_length_m === null ? '—' : `${fmt(entry.actual_length_m)} m`}
                  />
                ) : null}
                <Item label="Supplier" value={entry.supplier ?? '—'} />
                <Item label="Vehicle no." value={entry.vehicle_no ?? '—'} />
                <Item label="Batch no." value={entry.batch_no ?? '—'} />
                <Item label="Received by" value={entry.created_by ?? '—'} />
                <Item
                  label="Received on"
                  value={new Date(entry.created_at).toLocaleString('en-IN')}
                />
              </dl>
            </CardContent>
          </Card>

          {entry.approval_reason ? (
            <Card>
              <CardHeader>
                <CardTitle>Decision</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2">
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
                  <Item label="Decided by" value={entry.approved_by ?? '—'} />
                  <Item
                    label="Decided on"
                    value={
                      entry.approved_at ? new Date(entry.approved_at).toLocaleString('en-IN') : '—'
                    }
                  />
                </dl>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-[--muted-foreground]">
                    Reason
                  </p>
                  <p className="text-sm">{entry.approval_reason}</p>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <aside className="grid content-start gap-4">
          <Card className="bg-[--muted]/60">
            <CardHeader>
              <CardTitle>Calculation · derived</CardTitle>
            </CardHeader>
            <CardContent>
              {coil ? (
                <dl className="grid gap-3">
                  <Row
                    label="Weight / m"
                    value={material ? `${fmt(material.weight_per_m, 4)} kg` : '—'}
                  />
                  <Row label="Calculated length" value={`${fmt(entry.calc_length_m)} m`} strong />
                  <p className="text-xs text-[--muted-foreground]">
                    Coils carry no tolerance check.
                  </p>
                </dl>
              ) : (
                <dl className="grid gap-3">
                  <Row label="Theoretical" value={`${fmt(entry.theoretical_weight_kg)} kg`} />
                  <Row
                    label="Difference"
                    value={
                      entry.tolerance_kg === null
                        ? '—'
                        : `${Number(entry.tolerance_kg) >= 0 ? '+' : ''}${fmt(entry.tolerance_kg)} kg`
                    }
                  />
                  <Row
                    label="Tolerance"
                    value={
                      entry.tolerance_pct === null
                        ? '—'
                        : `${Number(entry.tolerance_pct) >= 0 ? '+' : ''}${fmt(entry.tolerance_pct)} %`
                    }
                    strong
                  />
                  <p className="text-xs text-[--muted-foreground]">
                    Accepted band is ±{TOLERANCE_PCT}%.
                  </p>
                </dl>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 text-sm">
              {inStock ? (
                <p className="text-emerald-700 dark:text-emerald-400">
                  ✓ Counted in stock for this SKU.
                </p>
              ) : entry.status === 'pending_approval' ? (
                <p className="text-amber-700 dark:text-amber-400">
                  ⚠ Not in stock until a manager approves it.
                </p>
              ) : (
                <p className="text-[--destructive]">✕ Rejected — not counted in stock.</p>
              )}
            </CardContent>
          </Card>

          {entry.status === 'pending_approval' ? <ApprovalPanel id={entry.id} /> : null}
        </aside>
      </div>
    </>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-[--muted-foreground]">{label}</dt>
      <dd className="tabular-nums text-sm font-medium">{value}</dd>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-xs text-[--muted-foreground]">{label}</dt>
      <dd className={strong ? 'tabular-nums text-lg font-semibold' : 'tabular-nums text-sm'}>
        {value}
      </dd>
    </div>
  );
}
