'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MaterialCombobox } from '@/components/inward/material-combobox';
import { SpecGrid } from '@/components/inward/spec-grid';
import { createInward } from '@/app/inward/actions';
import { calcInward, isCoil, lengthMismatch } from '@/lib/steel/inward';
import { TOLERANCE_PCT } from '@/lib/steel/constants';
import { fmt } from '@/lib/steel/num';
import type { InwardMaterial } from '@/lib/data/inward';

type Values = {
  material_id: string | null;
  actual_weight_kg: string;
  pieces: string;
  actual_length_m: string;
  supplier: string;
  vehicle_no: string;
  batch_no: string;
};

const EMPTY: Values = {
  material_id: null,
  actual_weight_kg: '',
  pieces: '',
  actual_length_m: '',
  supplier: '',
  vehicle_no: '',
  batch_no: '',
};

export function InwardForm({ materials }: { materials: InwardMaterial[] }) {
  const router = useRouter();
  const formRef = React.useRef<HTMLFormElement>(null);
  const [values, setValues] = React.useState<Values>(EMPTY);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const material = materials.find((m) => m.id === values.material_id) ?? null;
  const coil = material ? isCoil(material) : false;

  const calc = React.useMemo(() => {
    if (!material) return null;
    const weight = Number(values.actual_weight_kg);
    const pieces = Number(values.pieces);
    if (!Number.isFinite(weight) || weight <= 0) return null;
    if (!Number.isInteger(pieces) || pieces <= 0) return null;
    try {
      return calcInward(material, { actualWeightKg: weight, pieces });
    } catch {
      return null;
    }
  }, [material, values.actual_weight_kg, values.pieces]);

  // A length that differs from the master is a different SKU — a hard block, not a warning.
  const mismatch = React.useMemo(() => {
    if (!material || coil || values.actual_length_m.trim() === '') return null;
    return lengthMismatch(material, Number(values.actual_length_m));
  }, [material, coil, values.actual_length_m]);

  function set<K extends keyof Values>(key: K, value: Values[K]) {
    setError(null);
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  /** Keyboard-first: Enter moves to the next field rather than submitting. */
  function onKeyDown(event: React.KeyboardEvent<HTMLFormElement>) {
    if (event.key !== 'Enter') return;
    const target = event.target as HTMLElement;
    if (target.tagName !== 'INPUT') return;
    event.preventDefault();
    const fields = Array.from(
      formRef.current?.querySelectorAll<HTMLElement>('input:not([disabled]), button[type="submit"]') ??
        [],
    );
    const index = fields.indexOf(target);
    fields[index + 1]?.focus();
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!material) {
      setError('Pick a material first.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const result = await createInward({
        material_id: material.id,
        actual_weight_kg: values.actual_weight_kg,
        pieces: values.pieces,
        actual_length_m: coil ? undefined : values.actual_length_m || undefined,
        supplier: values.supplier,
        vehicle_no: values.vehicle_no,
        batch_no: values.batch_no,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      if (result.status === 'pending_approval') {
        toast.warning(`${result.mrn} saved as pending approval`, {
          description: `Outside ±${TOLERANCE_PCT}%. A manager must approve it with a reason before it counts as stock.`,
        });
      } else {
        toast.success(`${result.mrn} accepted`, { description: 'Stock updated.' });
      }
      router.push(`/inward/${result.id}`);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  const canSubmit = Boolean(material) && !mismatch && !saving && calc !== null;

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      onKeyDown={onKeyDown}
      className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]"
    >
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Material</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <MaterialCombobox
              materials={materials}
              value={values.material_id}
              onChange={(id) => set('material_id', id)}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Can&apos;t find it?{' '}
              <Link
                href={`/materials/new${material ? `?category=${material.category}` : ''}`}
                className="underline"
              >
                Add to Master →
              </Link>{' '}
              Inward can only receive an exact SKU that already exists.
            </p>
          </CardContent>
        </Card>

        {material ? <SpecGrid material={material} /> : null}

        <Card>
          <CardHeader>
            <CardTitle>Received</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            <Field label="Actual weight" suffix="kg">
              <Input
                type="number"
                step="0.001"
                min="0"
                inputMode="decimal"
                className="h-11 pr-9 text-base sm:h-9 sm:text-sm"
                value={values.actual_weight_kg}
                onChange={(e) => set('actual_weight_kg', e.target.value)}
              />
            </Field>
            <Field label={coil ? 'No. of coils' : 'No. of pieces'}>
              <Input
                type="number"
                step="1"
                min="1"
                inputMode="numeric"
                className="h-11 text-base sm:h-9 sm:text-sm"
                value={values.pieces}
                onChange={(e) => set('pieces', e.target.value)}
              />
            </Field>
            {!coil ? (
              <Field label="Actual length (optional)" suffix="m">
                <Input
                  type="number"
                  step="0.001"
                  min="0"
                  inputMode="decimal"
                  className="h-11 pr-9 text-base sm:h-9 sm:text-sm"
                  value={values.actual_length_m}
                  onChange={(e) => set('actual_length_m', e.target.value)}
                  aria-invalid={Boolean(mismatch)}
                />
              </Field>
            ) : null}
            <Field label="Supplier">
              <Input
                className="h-11 text-base sm:h-9 sm:text-sm"
                value={values.supplier}
                onChange={(e) => set('supplier', e.target.value)}
              />
            </Field>
            <Field label="Vehicle no.">
              <Input
                className="h-11 text-base sm:h-9 sm:text-sm"
                value={values.vehicle_no}
                onChange={(e) => set('vehicle_no', e.target.value)}
                placeholder="MH 12 AB 1234"
              />
            </Field>
            <Field label="Batch no.">
              <Input
                className="h-11 text-base sm:h-9 sm:text-sm"
                value={values.batch_no}
                onChange={(e) => set('batch_no', e.target.value)}
              />
            </Field>
          </CardContent>
        </Card>
      </div>

      <aside className="grid content-start gap-4 lg:sticky lg:top-16 lg:self-start">
        <Card className="bg-muted/60">
          <CardHeader>
            <CardTitle>Calculation · derived</CardTitle>
          </CardHeader>
          <CardContent>
            {!material ? (
              <p className="text-sm text-muted-foreground">Pick a material to start.</p>
            ) : calc === null ? (
              <p className="text-sm text-muted-foreground">
                Enter the weighbridge weight and the {coil ? 'coil' : 'piece'} count.
              </p>
            ) : calc.kind === 'coil' ? (
              <dl className="grid gap-3">
                <Row label="Weight / m" value={`${fmt(calc.weightPerM, 4)} kg`} />
                <Row label="Calculated length" value={`${fmt(calc.calcLengthM)} m`} strong />
                <p className="text-xs text-muted-foreground">
                  Coils have no theoretical weight to compare against, so no tolerance check
                  applies.
                </p>
              </dl>
            ) : (
              <dl className="grid gap-3">
                <Row label="Theoretical" value={`${fmt(calc.theoreticalKg)} kg`} />
                <Row
                  label="Difference"
                  value={`${calc.toleranceKg >= 0 ? '+' : ''}${fmt(calc.toleranceKg)} kg`}
                />
                <Row
                  label="Tolerance"
                  value={`${calc.tolerancePct >= 0 ? '+' : ''}${fmt(calc.tolerancePct)} %`}
                  strong
                />
                <p
                  className={
                    calc.withinTolerance
                      ? 'text-sm text-emerald-700 dark:text-emerald-400'
                      : 'text-sm text-amber-700 dark:text-amber-400'
                  }
                >
                  {calc.withinTolerance
                    ? `✓ Within ±${TOLERANCE_PCT}%`
                    : `⚠ Outside tolerance — will need manager approval`}
                </p>
              </dl>
            )}
          </CardContent>
        </Card>

        {mismatch ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            Length differs from Master ({mismatch.master} m). Create a {mismatch.actual} m SKU
            first —{' '}
            <Link
              href={`/materials/new?category=${material?.category ?? ''}`}
              className="underline"
            >
              open Master
            </Link>
            .
          </div>
        ) : null}

        {error ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <div className="flex gap-2">
          <Button type="submit" className="h-11 flex-1 sm:h-9" disabled={!canSubmit}>
            {saving ? 'Saving…' : 'Save entry'}
          </Button>
          <Button type="button" variant="outline" className="h-11 sm:h-9" asChild>
            <Link href="/inward">Cancel</Link>
          </Button>
        </div>
      </aside>
    </form>
  );
}

function Field({
  label,
  suffix,
  children,
}: {
  label: string;
  suffix?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1">
      <Label>{label}</Label>
      <div className="relative">
        {children}
        {suffix ? (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {suffix}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={strong ? 'tabular-nums text-lg font-semibold' : 'tabular-nums text-sm'}>
        {value}
      </dd>
    </div>
  );
}
