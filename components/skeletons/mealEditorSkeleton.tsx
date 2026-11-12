export default function MealEditorSkeleton() {
  return (
    <div aria-hidden className="space-y-6">
      <span className="block h-8 w-1/2 animate-pulse rounded bg-foreground/10" />
      <span className="block h-11 animate-pulse rounded-lg bg-foreground/10" />
      <span className="block h-16 animate-pulse rounded-lg bg-foreground/10" />
      <span className="block h-14 animate-pulse rounded-xl bg-foreground/10" />
      {Array.from({ length: 2 }, (_, i) => (
        <span key={i} className="block h-24 animate-pulse rounded-2xl bg-foreground/10" />
      ))}
      <span className="block h-64 animate-pulse rounded-2xl bg-foreground/10" />
    </div>
  );
}
