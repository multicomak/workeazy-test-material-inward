'use client';

import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { getCategory } from '@/lib/steel/categories';
import { buildDisplayName } from '@/lib/steel/displayName';
import { fmt } from '@/lib/steel/num';
import { cn } from '@/lib/utils';
import type { InwardMaterial } from '@/lib/data/inward';

export function MaterialCombobox({
  materials,
  value,
  onChange,
  autoFocus,
}: {
  materials: InwardMaterial[];
  value: string | null;
  onChange: (id: string) => void;
  autoFocus?: boolean;
}) {
  const [open, setOpen] = React.useState(false);

  const options = React.useMemo(
    () =>
      materials.map((m) => ({
        material: m,
        name: buildDisplayName(m),
        category: getCategory(m.category).label,
      })),
    [materials],
  );

  const selected = options.find((o) => o.material.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          autoFocus={autoFocus}
          className="h-11 w-full justify-between text-base font-normal sm:h-9 sm:text-sm"
        >
          <span className={cn('truncate', !selected && 'text-[--muted-foreground]')}>
            {selected ? selected.name : 'Search materials…'}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command
          filter={(itemValue, search) =>
            itemValue.toLowerCase().includes(search.toLowerCase()) ? 1 : 0
          }
        >
          <CommandInput placeholder="Search by name…" />
          <CommandList>
            <CommandEmpty>No material matches.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.material.id}
                  value={`${option.name} ${option.category}`}
                  onSelect={() => {
                    onChange(option.material.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'h-4 w-4 shrink-0',
                      option.material.id === value ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  <span className="flex-1 truncate">{option.name}</span>
                  <Badge variant="outline">{option.category}</Badge>
                  <span className="w-24 text-right text-xs tabular-nums text-[--muted-foreground]">
                    {option.material.weight_per_piece === null
                      ? `${fmt(option.material.weight_per_m)} kg/m`
                      : `${fmt(option.material.weight_per_piece)} kg/pc`}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
