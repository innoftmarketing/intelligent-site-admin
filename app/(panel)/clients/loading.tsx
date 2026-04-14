export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div className="space-y-2">
          <div className="h-7 w-32 animate-pulse rounded bg-muted" />
          <div className="h-4 w-48 animate-pulse rounded bg-muted/60" />
        </div>
        <div className="h-9 w-28 animate-pulse rounded bg-muted" />
      </div>
      <div className="h-10 w-72 animate-pulse rounded bg-muted/60" />
      <div className="overflow-hidden rounded-md border">
        <div className="h-10 border-b bg-muted/30" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex h-14 items-center gap-4 border-b px-4 last:border-b-0">
            <div className="h-3 w-32 animate-pulse rounded bg-muted/80" />
            <div className="h-3 w-28 animate-pulse rounded bg-muted/60" />
            <div className="h-3 w-40 animate-pulse rounded bg-muted/60" />
          </div>
        ))}
      </div>
    </div>
  );
}
