import { Badge } from '@/components/ui/badge';
import type { InwardStatus } from '@/lib/steel/types';

const CONFIG: Record<InwardStatus, { label: string; variant: 'green' | 'amber' | 'red' }> = {
  accepted: { label: 'Accepted', variant: 'green' },
  approved: { label: 'Approved', variant: 'green' },
  pending_approval: { label: 'Pending approval', variant: 'amber' },
  rejected: { label: 'Rejected', variant: 'red' },
};

export function StatusChip({ status }: { status: InwardStatus }) {
  const config = CONFIG[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export const STATUS_LABEL: Record<InwardStatus, string> = {
  accepted: 'Accepted',
  approved: 'Approved',
  pending_approval: 'Pending approval',
  rejected: 'Rejected',
};
