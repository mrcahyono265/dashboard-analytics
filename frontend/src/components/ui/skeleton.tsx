import { cn } from '@/lib/utils'

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-[shimmer_1.5s_infinite] rounded-md bg-gradient-to-r from-muted via-border to-muted bg-[length:200%_100%]',
        className
      )}
      {...props}
    />
  )
}

export function KPISkeleton() {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-5 w-5 rounded-full" />
      </div>
      <Skeleton className="mt-3 h-8 w-32" />
      <div className="mt-2 flex items-center gap-2">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  )
}

export function ChartSkeleton({ height = 350 }: { height?: number }) {
  return (
    <div className="rounded-xl border border-border bg-surface">
      <div className="border-b border-border px-6 py-4">
        <Skeleton className="h-5 w-40" />
      </div>
      <div className="p-6" style={{ height }}>
        <Skeleton className="h-full w-full" />
      </div>
    </div>
  )
}

export function TableSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-10 w-72 rounded-lg" />
      <div className="rounded-lg border border-border">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full border-b border-border last:border-b-0" />
        ))}
      </div>
    </div>
  )
}
