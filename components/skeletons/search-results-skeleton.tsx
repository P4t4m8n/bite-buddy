export default function SearchResultsSkeleton() {
  return (
    <ul aria-hidden className="space-y-2">
      {Array.from({ length: 6 }, (_, i) => (
        <li key={i} className="flex items-center gap-3 p-2">
          <span className="size-12 animate-pulse rounded-lg bg-foreground/10" />
          <span className="h-4 flex-1 animate-pulse rounded bg-foreground/10" />
        </li>
      ))}
    </ul>
  );
}
