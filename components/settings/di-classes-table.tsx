'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { deleteDiClass, upsertDiClass } from '@/app/settings/actions';
import type { DiPipeClassRow } from '@/lib/steel/types';

const CLASSES = ['K7', 'K9', 'K12'] as const;

const FALLBACK: Record<string, (od: number) => number> = {
  K7: (od) => od / 24 + 3,
  K9: (od) => od / 20 + 3,
  K12: (od) => od / 16 + 3,
};

export function DiClassesTable({ rows }: { rows: DiPipeClassRow[] }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [draft, setDraft] = React.useState({ od_mm: '', class: 'K9', thickness_mm: '' });
  const [edits, setEdits] = React.useState<Record<string, string>>({});

  async function run(fn: () => Promise<{ ok: boolean; error?: string }>, success: string) {
    setPending(true);
    try {
      const result = await fn();
      if (!result.ok) {
        toast.error(result.error ?? 'Something went wrong');
        return false;
      }
      toast.success(success);
      router.refresh();
      return true;
    } finally {
      setPending(false);
    }
  }

  async function add(event: React.FormEvent) {
    event.preventDefault();
    const ok = await run(() => upsertDiClass(draft), 'Class row saved');
    if (ok) setDraft((d) => ({ ...d, od_mm: '', thickness_mm: '' }));
  }

  const suggestion =
    draft.od_mm && FALLBACK[draft.class]
      ? FALLBACK[draft.class]!(Number(draft.od_mm)).toFixed(2)
      : null;

  return (
    <div className="grid gap-4">
      <form
        onSubmit={add}
        className="flex flex-wrap items-end gap-2 rounded-lg border bg-[--muted]/40 p-3"
      >
        <div className="grid gap-1">
          <Label>OD</Label>
          <Input
            className="w-28"
            type="number"
            step="0.1"
            min="0"
            value={draft.od_mm}
            onChange={(e) => setDraft((d) => ({ ...d, od_mm: e.target.value }))}
            placeholder="200"
          />
        </div>
        <div className="grid gap-1">
          <Label>Class</Label>
          <Select value={draft.class} onValueChange={(v) => setDraft((d) => ({ ...d, class: v }))}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CLASSES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1">
          <Label>Thickness (mm)</Label>
          <Input
            className="w-32"
            type="number"
            step="0.01"
            min="0"
            value={draft.thickness_mm}
            onChange={(e) => setDraft((d) => ({ ...d, thickness_mm: e.target.value }))}
          />
        </div>
        <Button type="submit" size="sm" disabled={pending}>
          Add / update
        </Button>
        <p className="w-full text-xs text-[--muted-foreground]">
          Rows here override the class formula.
          {suggestion ? (
            <>
              {' '}
              Formula for {draft.class} at OD {draft.od_mm} would give{' '}
              <span className="font-medium text-[--foreground]">{suggestion} mm</span>.
            </>
          ) : null}
        </p>
      </form>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-32 text-right">OD (mm)</TableHead>
              <TableHead>Class</TableHead>
              <TableHead className="w-40 text-right">Thickness (mm)</TableHead>
              <TableHead className="w-32" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const key = `${row.od_mm}|${row.class}`;
              const value = edits[key];
              const dirty = value !== undefined && Number(value) !== Number(row.thickness_mm);
              return (
                <TableRow key={key}>
                  <TableCell className="text-right font-medium">{row.od_mm}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{row.class}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Input
                      className="ml-auto h-8 w-28 text-right"
                      type="number"
                      step="0.01"
                      min="0"
                      value={value ?? String(row.thickness_mm)}
                      onChange={(e) => setEdits((p) => ({ ...p, [key]: e.target.value }))}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {dirty ? (
                        <Button
                          size="sm"
                          disabled={pending}
                          onClick={() =>
                            run(
                              () =>
                                upsertDiClass({
                                  od_mm: row.od_mm,
                                  class: row.class,
                                  thickness_mm: value,
                                }),
                              'Class row updated',
                            )
                          }
                        >
                          Save
                        </Button>
                      ) : null}
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={pending}
                        onClick={() =>
                          run(() => deleteDiClass(row.od_mm, row.class), 'Class row removed')
                        }
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-[--muted-foreground]">
                  No rows yet — every DI pipe falls back to its class formula.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
