import { cn } from '@/lib/utils';

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} {...props} />;
}

export function TableSkeleton({ columns, rows = 6 }: { columns: number; rows?: number }) {
  return (
    <div className="rounded-lg border">
      <div className="flex h-8 items-center gap-3 border-b bg-muted/40 px-3">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-2.5 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-3 border-b px-3 py-2.5 last:border-0">
          {Array.from({ length: columns }).map((_, c) => (
            <Skeleton key={c} className="h-3 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="grid gap-4">
        {[3, 4, 2].map((count, i) => (
          <div key={i} className="rounded-lg border p-4">
            <Skeleton className="mb-3 h-3 w-32" />
            <div className="grid gap-3 sm:grid-cols-3">
              {Array.from({ length: count }).map((_, j) => (
                <Skeleton key={j} className="h-9" />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="grid content-start gap-4">
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-36 rounded-lg" />
        <Skeleton className="h-9 rounded-md" />
      </div>
    </div>
  );
}
