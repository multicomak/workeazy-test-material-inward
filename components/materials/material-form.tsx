'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { WeightCard } from '@/components/materials/weight-card';
import { saveMaterial } from '@/app/materials/actions';
import { CATEGORY_LIST, allowedUnits, getCategory } from '@/lib/steel/categories';
import { buildDisplayName } from '@/lib/steel/displayName';
import { tryComputeWeight } from '@/lib/steel/weight';
import { UNIT_LABEL } from '@/lib/steel/units';
import type { CategoryCode, Lookups, Unit } from '@/lib/steel/types';

type SpecValues = Record<string, string>;

export type MaterialFormValues = {
  id?: string;
  category: CategoryCode;
  sub_category: string;
  grade: string;
  hsn_code: string;
  manufacturer: string;
  brand: string;
  is_active: boolean;
  specs: SpecValues;
  buy_units: Unit[];
  sell_units: Unit[];
};

function defaultsFor(category: CategoryCode): MaterialFormValues {
  const def = getCategory(category);
  return {
    category,
    sub_category: '',
    grade: '',
    hsn_code: '',
    manufacturer: '',
    brand: '',
    is_active: true,
    specs: Object.fromEntries(def.fields.map((f) => [f.name, ''])),
    buy_units: [...def.defaultBuyUnits],
    sell_units: [...def.defaultSellUnits],
  };
}

export function MaterialForm({
  lookups,
  designations,
  initial,
  mode,
}: {
  lookups: Lookups;
  designations: Record<string, string[]>;
  initial?: MaterialFormValues;
  mode: 'create' | 'edit';
}) {
  const router = useRouter();
  const [values, setValues] = React.useState<MaterialFormValues>(
    () => initial ?? defaultsFor('pipe'),
  );
  const [saving, setSaving] = React.useState(false);
  const [formError, setFormError] = React.useState<{ message: string; duplicateId?: string } | null>(
    null,
  );

  const def = getCategory(values.category);

  // The same pure function the server action uses — no second weight implementation.
  const weightState = React.useMemo(
    () => tryComputeWeight(values.category, values.specs, lookups),
    [values.category, values.specs, lookups],
  );

  function setCategory(category: CategoryCode) {
    setFormError(null);
    setValues((prev) => ({ ...defaultsFor(category), ...pickMeta(prev), category, specs: defaultsFor(category).specs }));
  }

  function pickMeta(v: MaterialFormValues) {
    return {
      sub_category: v.sub_category,
      grade: v.grade,
      hsn_code: v.hsn_code,
      manufacturer: v.manufacturer,
      brand: v.brand,
      is_active: v.is_active,
    };
  }

  function setSpec(name: string, value: string) {
    setFormError(null);
    setValues((prev) => ({ ...prev, specs: { ...prev.specs, [name]: value } }));
  }

  function toggleUnit(side: 'buy_units' | 'sell_units', unit: Unit, checked: boolean) {
    setValues((prev) => {
      const next = checked
        ? [...prev[side], unit]
        : prev[side].filter((u) => u !== unit);
      return { ...prev, [side]: next };
    });
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);
    setSaving(true);
    try {
      const result = await saveMaterial(
        {
          category: values.category,
          sub_category: values.sub_category,
          grade: values.grade,
          hsn_code: values.hsn_code,
          manufacturer: values.manufacturer,
          brand: values.brand,
          is_active: values.is_active,
          specs: values.specs,
          buy_units: values.buy_units,
          sell_units: values.sell_units,
        },
        values.id,
      );

      if (!result.ok) {
        setFormError({ message: result.error, duplicateId: result.duplicateId });
        return;
      }
      toast.success(mode === 'create' ? 'Material created' : 'Material saved');
      router.push('/materials');
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  const preview = buildDisplayName({
    category: values.category,
    specs: values.specs,
    sub_category: values.sub_category,
    grade: values.grade,
  });

  return (
    <form onSubmit={onSubmit} className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Identification</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            <FieldWrap label="Category" hint={mode === 'edit' ? 'Locked after creation' : undefined}>
              <Select
                value={values.category}
                onValueChange={(v) => setCategory(v as CategoryCode)}
                disabled={mode === 'edit'}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_LIST.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldWrap>

            <TextField
              label="Sub-category"
              value={values.sub_category}
              onChange={(v) => setValues((p) => ({ ...p, sub_category: v }))}
              placeholder="HR / PPGI / Flat…"
            />
            <TextField
              label="Grade"
              value={values.grade}
              onChange={(v) => setValues((p) => ({ ...p, grade: v }))}
              placeholder="IS 2062 / GI Z275"
            />
            <TextField
              label="HSN code"
              value={values.hsn_code}
              onChange={(v) => setValues((p) => ({ ...p, hsn_code: v }))}
              placeholder="7306"
            />
            <TextField
              label="Manufacturer"
              value={values.manufacturer}
              onChange={(v) => setValues((p) => ({ ...p, manufacturer: v }))}
            />
            <TextField
              label="Brand"
              value={values.brand}
              onChange={(v) => setValues((p) => ({ ...p, brand: v }))}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Technical specs</CardTitle>
            <p className="text-xs text-muted-foreground">
              Every spec is part of the SKU. Changing any one of them is a different material.
            </p>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-4">
            {def.fields.map((field) => {
              if (field.kind === 'select') {
                const options = field.options ?? designations[field.optionsFrom ?? ''] ?? [];
                return (
                  <FieldWrap key={field.name} label={field.label}>
                    <Select
                      value={values.specs[field.name] || undefined}
                      onValueChange={(v) => setSpec(field.name, v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select…" />
                      </SelectTrigger>
                      <SelectContent>
                        {options.length === 0 ? (
                          <div className="px-2 py-3 text-xs text-muted-foreground">
                            No sections seeded yet.
                          </div>
                        ) : (
                          options.map((option) => (
                            <SelectItem key={option} value={option}>
                              {def.sectionType ? `${def.sectionType} ${option}` : option}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </FieldWrap>
                );
              }
              return (
                <FieldWrap key={field.name} label={field.label}>
                  <div className="relative">
                    <Input
                      type="number"
                      step={field.step}
                      min={0}
                      inputMode="decimal"
                      className="pr-9"
                      value={values.specs[field.name] ?? ''}
                      onChange={(e) => setSpec(field.name, e.target.value)}
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      {field.unit}
                    </span>
                  </div>
                </FieldWrap>
              );
            })}
            {!def.hasLength ? (
              <p className="col-span-full text-xs text-muted-foreground">
                Coils have no length in the master — it is derived at inward from the actual weight.
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Units</CardTitle>
            <p className="text-xs text-muted-foreground">
              Prefilled from the category. You can untick, but not add units outside its set.
            </p>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <UnitGroup
              title="Buy units"
              allowed={allowedUnits(values.category, 'buy')}
              selected={values.buy_units}
              onToggle={(u, c) => toggleUnit('buy_units', u, c)}
            />
            <UnitGroup
              title="Sell units"
              allowed={allowedUnits(values.category, 'sell')}
              selected={values.sell_units}
              onToggle={(u, c) => toggleUnit('sell_units', u, c)}
            />
          </CardContent>
        </Card>
      </div>

      <aside className="grid content-start gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Name preview</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">{preview}</p>
          </CardContent>
        </Card>

        <WeightCard category={values.category} state={weightState} />

        <Card>
          <CardContent className="pt-4">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={values.is_active}
                onCheckedChange={(c) => setValues((p) => ({ ...p, is_active: c === true }))}
              />
              Active
            </label>
          </CardContent>
        </Card>

        {formError ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {formError.message}
            {formError.duplicateId ? (
              <>
                {' — '}
                <Link href={`/materials/${formError.duplicateId}`} className="underline">
                  open it
                </Link>
              </>
            ) : null}
          </div>
        ) : null}

        <div className="flex gap-2">
          <Button type="submit" disabled={saving || !weightState.ok} className="flex-1">
            {saving ? 'Saving…' : mode === 'create' ? 'Create material' : 'Save changes'}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/materials">Cancel</Link>
          </Button>
        </div>
        {!weightState.ok ? (
          <p className="text-xs text-muted-foreground">
            Saving is blocked until the specs produce a weight.
          </p>
        ) : null}
      </aside>
    </form>
  );
}

function FieldWrap({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1">
      <Label>{label}</Label>
      {children}
      {hint ? <span className="text-[11px] text-muted-foreground">{hint}</span> : null}
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <FieldWrap label={label}>
      <Input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </FieldWrap>
  );
}

function UnitGroup({
  title,
  allowed,
  selected,
  onToggle,
}: {
  title: string;
  allowed: readonly Unit[];
  selected: Unit[];
  onToggle: (unit: Unit, checked: boolean) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-muted-foreground">{title}</p>
      <div className="flex flex-wrap gap-3">
        {allowed.map((unit) => (
          <label key={unit} className="flex items-center gap-1.5 text-sm">
            <Checkbox
              checked={selected.includes(unit)}
              onCheckedChange={(c) => onToggle(unit, c === true)}
            />
            {unit}
            <span className="text-xs text-muted-foreground">({UNIT_LABEL[unit]})</span>
          </label>
        ))}
      </div>
    </div>
  );
}
