import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

const DEBOUNCE_MS = 300;

/**
 * State for a search box that mirrors `?q=` in the URL. The typed query is pushed to
 * the URL after a short pause and the server renders the results. Other params
 * (e.g. the diary day) stay; the page number resets.
 */
export const useSearchInput = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";
  const [value, setValue] = useState(urlQuery);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const query = value.trim();
    if (query === urlQuery) return;
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      params.delete("page");
      if (query) params.set("q", query);
      else params.delete("q");
      const search = params.toString();
      const href = search ? `${pathname}?${search}` : pathname;
      startTransition(() => router.replace(href, { scroll: false }));
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [value, urlQuery, pathname, router, searchParams]);

  return { value, setValue, clear: () => setValue(""), isPending };
};
