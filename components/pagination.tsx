import Link from "next/link";

type PaginationProps = {
  page: number;
  hasMore: boolean;
  hrefFor: (page: number) => string;
};

/** Previous/next links. "Previous" is on the right because the app is RTL. */
export default function Pagination({ page, hasMore, hrefFor }: PaginationProps) {
  if (page <= 1 && !hasMore) return null;

  return (
    <nav aria-label="עמודים" className="mt-4 flex items-center justify-between text-sm">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className="font-medium text-brand">
          → הקודם
        </Link>
      ) : (
        <span />
      )}
      <span className="text-foreground/60">עמוד {page}</span>
      {hasMore ? (
        <Link href={hrefFor(page + 1)} className="font-medium text-brand">
          הבא ←
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
