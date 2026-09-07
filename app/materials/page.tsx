import Link from 'next/link';
import { Suspense } from 'react';
import { Badge } from '@/components/ui/badge';
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
import { MaterialsFilters } from '@/components/materials/materials-filters';
import { getStock, listMaterials } from '@/lib/data/materials';
import { isSupabaseConfigured } from '@/lib/supabase/server';
import { getCategory, isCategoryCode } from '@/lib/steel/categories';
import { buildDisplayName } from '@/lib/steel/displayName';
import { fmt } from '@/lib/steel/num';
import { tryFromKg } from '@/lib/steel/units';

export const dynamic = 'force-dynamic';

export default async function MaterialsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const params = await searchParams;
  const category = isCategoryCode(params.category) ? params.category : undefined;
  const q = params.q?.trim().toLowerCase();

  const header = (
    <PageHeader
      title="Material master"
      subtitle="One row per SKU. Any spec change — including length — is a new material."
      actions={
        <Button asChild size="sm">
          <Link href="/materials/new">Add material</Link>
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

  const [materials, stock] = await Promise.all([listMaterials(), getStock()]);

  const rows = materials
    .map((m) => ({ ...m, name: buildDisplayName(m) }))
    .filter((m) => (category ? m.category === category : true))
    .filter((m) => (q ? m.name.toLowerCase().includes(q) : true));

  return (
    <>
      {header}

      <div className="mb-3">
        <Suspense fallback={null}>
          <MaterialsFilters category={category} q={params.q} />
        </Suspense>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title={materials.length === 0 ? 'No materials yet' : 'No materials match this filter'}
          description={
            materials.length === 0
              ? 'Create the first SKU. Specs drive the weight — you never type a weight in.'
              : 'Try a different category or search term.'
          }
          action={
            materials.length === 0 ? (
              <Button asChild size="sm">
                <Link href="/materials/new">Add material</Link>
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead className="text-right">Weight/pc</TableHead>
                <TableHead className="text-right">Stock KG</TableHead>
                <TableHead className="text-right">Stock PCS</TableHead>
                <TableHead className="text-right">Stock M</TableHead>
                <TableHead>Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((m) => {
                const s = stock.get(m.id);
                const kg = s ? Number(s.stock_kg) : 0;
                // Pieces are counted at the weighbridge, so the recorded count is the
                // truth. Metres are derived from KG, per the unit rules.
                const pcs = s?.stock_pcs ?? null;
                const metres = tryFromKg(kg, 'M', m);
                return (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">
                      <Link href={`/materials/${m.id}`} className="hover:underline">
                        {m.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-[--muted-foreground]">
                      {getCategory(m.category).label}
                    </TableCell>
                    <TableCell className="text-[--muted-foreground]">{m.grade ?? '—'}</TableCell>
                    <TableCell className="text-[--muted-foreground]">{m.brand ?? '—'}</TableCell>
                    <TableCell className="text-right">{fmt(m.weight_per_piece, 3)}</TableCell>
                    <TableCell className="text-right">{fmt(kg)}</TableCell>
                    <TableCell className="text-right">
                      {pcs === null ? '—' : fmt(pcs, 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      {metres === null ? '—' : fmt(metres)}
                    </TableCell>
                    <TableCell>
                      {m.is_active ? (
                        <Badge variant="green">Active</Badge>
                      ) : (
                        <Badge variant="outline">Inactive</Badge>
                      )}
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
