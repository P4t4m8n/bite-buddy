export default function MealListSkeleton() {
  return (
    <ul aria-hidden className="space-y-3">
      {Array.from({ length: 4 }, (_, i) => (
        <li key={i} className="space-y-2 rounded-2xl border border-foreground/10 p-4">
          <span className="block h-5 w-1/2 animate-pulse rounded bg-foreground/10" />
          <span className="block h-4 w-1/4 animate-pulse rounded bg-foreground/10" />
          <span className="block h-3 w-3/4 animate-pulse rounded bg-foreground/10" />
        </li>
      ))}
    </ul>
  );
}
