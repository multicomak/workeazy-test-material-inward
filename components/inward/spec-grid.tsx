import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCategory } from '@/lib/steel/categories';
import { fmt } from '@/lib/steel/num';
import { isApproximate, WEIGHT_SOURCE_LABEL } from '@/lib/steel/weight';
import type { CategoryCode, WeightSource } from '@/lib/steel/types';

/**
 * Specs come from the master and are read-only. There is deliberately no path
 * to enter or override a spec on inward.
 */
export function SpecGrid({
  material,
}: {
  material: {
    category: CategoryCode;
    specs: Record<string, unknown>;
    weight_per_m: number;
    weight_per_piece: number | null;
    weight_source: WeightSource;
    grade?: string | null;
    sub_category?: string | null;
    brand?: string | null;
  };
}) {
  const def = getCategory(material.category);

  return (
    <Card className="bg-muted/60">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Specs from master · read-only</CardTitle>
        <Badge variant={isApproximate(material.weight_source) ? 'amber' : 'blue'}>
          {WEIGHT_SOURCE_LABEL[material.weight_source]}
        </Badge>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
          <Item label="Category" value={def.label} />
          {material.grade ? <Item label="Grade" value={material.grade} /> : null}
          {material.sub_category ? (
            <Item label="Sub-category" value={material.sub_category} />
          ) : null}
          {material.brand ? <Item label="Brand" value={material.brand} /> : null}
          {def.fields.map((field) => (
            <Item
              key={field.name}
              label={field.label}
              value={
                field.kind === 'number'
                  ? `${material.specs[field.name] ?? '—'} ${field.unit}`
                  : `${def.sectionType ? `${def.sectionType} ` : ''}${material.specs[field.name] ?? '—'}`
              }
            />
          ))}
          <Item label="Weight / m" value={`${fmt(material.weight_per_m, 4)} kg`} />
          {def.hasLength ? (
            <Item label="Weight / piece" value={`${fmt(material.weight_per_piece, 3)} kg`} />
          ) : null}
        </dl>
      </CardContent>
    </Card>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="tabular-nums text-sm font-medium">{value}</dd>
    </div>
  );
}
