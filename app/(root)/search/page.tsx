import { Suspense } from "react";

import { requireUser } from "@/lib/auth/current-user";
import { searchFoods } from "@/lib/food/search";
import { MIN_QUERY_LENGTH, parseFoodSearchParams } from "@/lib/food/search-params";

import PageHeader from "@/components/page-header";
import SearchInput from "@/components/search/search-input";
import SearchResults from "@/components/search/search-results";
import SearchInputSkeleton from "@/components/skeletons/search-input-skeleton";
import SearchResultsSkeleton from "@/components/skeletons/search-results-skeleton";

import type { Metadata } from "next";

export const metadata: Metadata = { title: "חיפוש" };

export default function SearchPage({ searchParams }: PageProps<"/search">) {
  return (
    <>
      <PageHeader title="חיפוש" description="מחפשים מוצרים לפי שם או מותג." />
      {/* The input reads the URL, so it renders on the client behind a boundary. */}
      <Suspense fallback={<SearchInputSkeleton />}>
        <SearchInput />
      </Suspense>
      <div className="mt-4">
        <Suspense fallback={<SearchResultsSkeleton />}>
          <SearchResultsLoader searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}

// smart: reads ?q=&page= and the user, then searches
const SearchResultsLoader = async ({
  searchParams,
}: Pick<PageProps<"/search">, "searchParams">) => {
  const { q, page } = parseFoodSearchParams(await searchParams);
  if (q.length < MIN_QUERY_LENGTH) {
    return <SearchResults query={q} page={page} items={[]} hasMore={false} />;
  }

  const user = await requireUser();
  const { items, hasMore } = await searchFoods({ query: q, page, userId: user.id });
  return <SearchResults query={q} page={page} items={items} hasMore={hasMore} />;
};
