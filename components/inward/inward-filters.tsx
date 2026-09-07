'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { STATUS_LABEL } from '@/components/inward/status-chip';
import type { InwardStatus } from '@/lib/steel/types';

const ALL = '__all__';
const STATUSES: InwardStatus[] = ['pending_approval', 'accepted', 'approved', 'rejected'];

export function InwardFilters({ status }: { status?: InwardStatus }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function push(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === ALL) params.delete('status');
    else params.set('status', value);
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <Select value={status ?? ALL} onValueChange={push}>
      <SelectTrigger className="h-8 w-56">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>All statuses</SelectItem>
        {STATUSES.map((s) => (
          <SelectItem key={s} value={s}>
            {STATUS_LABEL[s]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
