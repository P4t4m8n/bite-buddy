import { MIN_QUERY_LENGTH, searchHref } from "@/lib/food/search-params";

import FoodListItem from "@/components/food/food-list-item";
import Hint from "@/components/hint";
import Pagination from "@/components/pagination";
import NewFoodLink from "@/components/search/new-food-link";

import type { FoodSearchResult } from "@/lib/food/search";

type SearchResultsProps = {
  query: string;
  page: number;
  items: FoodSearchResult[];
  hasMore: boolean;
};

export default function SearchResults({ query, page, items, hasMore }: SearchResultsProps) {
  if (query.length < MIN_QUERY_LENGTH) {
    return <Hint>הקלידו לפחות {MIN_QUERY_LENGTH} תווים כדי לחפש.</Hint>;
  }

  if (items.length === 0) {
    return (
      <>
        <Hint>לא נמצאו מוצרים עבור ״{query}״.</Hint>
        <NewFoodLink query={query} />
      </>
    );
  }

  return (
    <>
      <ul className="-mx-2">
        {items.map((food) => (
          <FoodListItem key={food.id} food={food} />
        ))}
      </ul>
      {hasMore ? null : <NewFoodLink query={query} />}
      <Pagination page={page} hasMore={hasMore} hrefFor={(target) => searchHref(query, target)} />
    </>
  );
}
