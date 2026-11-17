export default function DiarySkeleton() {
  return (
    <div aria-hidden className="space-y-6">
      <span className="mx-auto block h-8 w-32 animate-pulse rounded bg-foreground/10" />
      <span className="block h-48 animate-pulse rounded-2xl bg-foreground/10" />
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="space-y-2">
          <span className="block h-5 w-28 animate-pulse rounded bg-foreground/10" />
          <span className="block h-16 animate-pulse rounded-2xl bg-foreground/10" />
        </div>
      ))}
    </div>
  );
}
