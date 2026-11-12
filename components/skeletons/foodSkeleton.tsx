export default function FoodSkeleton() {
  return (
    <div aria-hidden className="space-y-6">
      <div className="flex gap-4">
        <span className="size-24 animate-pulse rounded-lg bg-foreground/10" />
        <div className="flex-1 space-y-2">
          <span className="block h-6 w-3/4 animate-pulse rounded bg-foreground/10" />
          <span className="block h-4 w-1/2 animate-pulse rounded bg-foreground/10" />
        </div>
      </div>
      <span className="block h-64 animate-pulse rounded-xl bg-foreground/10" />
    </div>
  );
}
