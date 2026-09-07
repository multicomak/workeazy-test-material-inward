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
import { deleteIs808Section, upsertIs808Section } from '@/app/settings/actions';
import { fmt } from '@/lib/steel/num';
import type { Is808Row, SectionType } from '@/lib/steel/types';

const TYPES: SectionType[] = ['ISA', 'ISMC', 'ISMB', 'ISWB'];

export function Is808Table({ rows }: { rows: Is808Row[] }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [draft, setDraft] = React.useState({
    section_type: 'ISA' as SectionType,
    designation: '',
    kg_per_m: '',
  });
  const [edits, setEdits] = React.useState<Record<string, string>>({});
  const [filter, setFilter] = React.useState<SectionType | '__all__'>('__all__');

  const visible = rows.filter((r) => filter === '__all__' || r.section_type === filter);

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
    const ok = await run(
      () => upsertIs808Section(draft),
      `${draft.section_type} ${draft.designation} saved`,
    );
    if (ok) setDraft((d) => ({ ...d, designation: '', kg_per_m: '' }));
  }

  return (
    <div className="grid gap-4">
      <form
        onSubmit={add}
        className="flex flex-wrap items-end gap-2 rounded-lg border bg-muted/40 p-3"
      >
        <div className="grid gap-1">
          <Label>Section type</Label>
          <Select
            value={draft.section_type}
            onValueChange={(v) => setDraft((d) => ({ ...d, section_type: v as SectionType }))}
          >
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1">
          <Label>Designation</Label>
          <Input
            className="w-40"
            value={draft.designation}
            onChange={(e) => setDraft((d) => ({ ...d, designation: e.target.value }))}
            placeholder={draft.section_type === 'ISA' ? '65x65x8' : '175'}
          />
        </div>
        <div className="grid gap-1">
          <Label>kg / m</Label>
          <Input
            className="w-28"
            type="number"
            step="0.01"
            min="0"
            value={draft.kg_per_m}
            onChange={(e) => setDraft((d) => ({ ...d, kg_per_m: e.target.value }))}
          />
        </div>
        <Button type="submit" size="sm" disabled={pending}>
          Add / update
        </Button>
        <p className="w-full text-xs text-muted-foreground">
          Store the bare size only — <code className="font-mono">100</code> for ISMC/ISMB/ISWB,{' '}
          <code className="font-mono">{'{a}x{b}x{t}'}</code> with the longer leg first for ISA.
        </p>
      </form>

      <div className="flex items-center gap-2">
        <Label>Filter</Label>
        <Select value={filter} onValueChange={(v) => setFilter(v as SectionType | '__all__')}>
          <SelectTrigger className="h-8 w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All types</SelectItem>
            {TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">{visible.length} sections</span>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Designation</TableHead>
              <TableHead className="w-40 text-right">kg / m</TableHead>
              <TableHead className="w-32" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((row) => {
              const key = `${row.section_type}|${row.designation}`;
              const value = edits[key];
              const dirty = value !== undefined && Number(value) !== Number(row.kg_per_m);
              return (
                <TableRow key={key}>
                  <TableCell>
                    <Badge variant="outline">{row.section_type}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{row.designation}</TableCell>
                  <TableCell className="text-right">
                    <Input
                      className="ml-auto h-8 w-28 text-right"
                      type="number"
                      step="0.01"
                      min="0"
                      value={value ?? String(row.kg_per_m)}
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
                                upsertIs808Section({
                                  section_type: row.section_type,
                                  designation: row.designation,
                                  kg_per_m: value,
                                }),
                              'Section updated',
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
                          run(
                            () => deleteIs808Section(row.section_type, row.designation),
                            'Section removed',
                          )
                        }
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {visible.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                  No sections for this type yet.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">
        Editing a section does not restate materials already saved — their weight was frozen at
        save time and is recomputed the next time they are edited. Total: {fmt(rows.length, 0)}{' '}
        rows.
      </p>
    </div>
  );
}
