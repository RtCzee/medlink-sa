export default function Loading() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 animate-pulse rounded-xl bg-foreground/5" />
        <div className="space-y-2">
          <div className="h-4 w-40 animate-pulse rounded bg-foreground/5" />
          <div className="h-3 w-28 animate-pulse rounded bg-foreground/5" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-panel p-4 space-y-3">
            <div className="h-3 w-20 animate-pulse rounded bg-foreground/5" />
            <div className="h-6 w-12 animate-pulse rounded bg-foreground/5" />
            <div className="h-2 w-24 animate-pulse rounded bg-foreground/5" />
          </div>
        ))}
      </div>
      <div className="glass-panel p-5 space-y-3">
        <div className="h-4 w-32 animate-pulse rounded bg-foreground/5" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-10 w-10 animate-pulse rounded-lg bg-foreground/5" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-36 animate-pulse rounded bg-foreground/5" />
              <div className="h-2 w-24 animate-pulse rounded bg-foreground/5" />
            </div>
            <div className="h-6 w-16 animate-pulse rounded-full bg-foreground/5" />
          </div>
        ))}
      </div>
    </div>
  );
}
