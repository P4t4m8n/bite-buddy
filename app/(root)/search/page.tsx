import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { FoodListItem } from "@/components/food/food-list-item";
import { PageHeader } from "@/components/page-header";
import { SearchInput } from "@/components/search/search-input";
import { requireUser } from "@/lib/auth/current-user";
import { searchFoods } from "@/lib/food/search";
import { MIN_QUERY_LENGTH, parseFoodSearchParams, searchHref } from "@/lib/food/search-params";

export const metadata: Metadata = { title: "חיפוש" };

export default function SearchPage({ searchParams }: PageProps<"/search">) {
  return (
    <>
      <PageHeader title="חיפוש" description="מחפשים מוצרים לפי שם או מותג." />
      {/* The input reads the URL, so it renders on the client behind a boundary. */}
      <Suspense fallback={<div className="h-12 rounded-xl border border-foreground/15" />}>
        <SearchInput />
      </Suspense>
      <div className="mt-4">
        <Suspense fallback={<ResultsSkeleton />}>
          <SearchResults searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}

const SearchResults = async ({ searchParams }: Pick<PageProps<"/search">, "searchParams">) => {
  const { q, page } = parseFoodSearchParams(await searchParams);

  if (q.length < MIN_QUERY_LENGTH) {
    return <Hint>הקלידו לפחות {MIN_QUERY_LENGTH} תווים כדי לחפש.</Hint>;
  }

  const user = await requireUser();
  const { items, hasMore } = await searchFoods({ query: q, page, userId: user.id });

  if (items.length === 0) {
    return <Hint>לא נמצאו מוצרים עבור ״{q}״.</Hint>;
  }

  return (
    <>
      <ul className="-mx-2">
        {items.map((food) => (
          <FoodListItem key={food.id} food={food} />
        ))}
      </ul>
      {page > 1 || hasMore ? (
        <nav aria-label="עמודים" className="mt-4 flex items-center justify-between text-sm">
          {page > 1 ? (
            <Link href={searchHref(q, page - 1)} className="font-medium text-brand">
              → הקודם
            </Link>
          ) : (
            <span />
          )}
          <span className="text-foreground/60">עמוד {page}</span>
          {hasMore ? (
            <Link href={searchHref(q, page + 1)} className="font-medium text-brand">
              הבא ←
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </>
  );
};

const Hint = ({ children }: { children: React.ReactNode }) => (
  <p className="py-8 text-center text-sm text-foreground/60">{children}</p>
);

const ResultsSkeleton = () => (
  <ul aria-hidden className="space-y-2">
    {Array.from({ length: 6 }, (_, i) => (
      <li key={i} className="flex items-center gap-3 p-2">
        <span className="size-12 animate-pulse rounded-lg bg-foreground/10" />
        <span className="h-4 flex-1 animate-pulse rounded bg-foreground/10" />
      </li>
    ))}
  </ul>
);
