# Code conventions

The rules the whole codebase follows. When adding code, match these; if a rule needs to change, change it here and across the code in the same commit.

Tooling enforces what it can: `npm run lint` (ESLint, including import order), `npm run format` (Prettier), `npm run typecheck`.

## Files and folders

- **File names are kebab-case**: `meal-card.tsx`, `search-input-skeleton.tsx`, `use-search-input.ts`.
- **Components live in a feature folder** under `components/`: `auth/`, `diary/`, `food/`, `meals/`, `scan/`, `search/`, `settings/`, `stats/`, `pwa/`, `skeletons/`. Shared app-wide pieces (`page-header`, `back-button`, `pagination`, `hint`, `toast`, top bar, bottom nav, user menu, avatar) sit directly in `components/`.
- **Non-UI code lives in `lib/<feature>/`**: server reads in `queries.ts`, Zod schemas in `schemas.ts`, pure helpers in `helpers.ts` / named files, types in `types.ts`. Client hooks go in `lib/hooks/use-*.ts`.
- **Unit tests** sit next to the code as `*.test.ts`; E2E tests are in `e2e/*.spec.ts`.

## Components

- **One component per file, exported as `export default function Name(...)`.** The file name is the component name in kebab-case.
- Small helpers used only inside that file are arrow functions (`const Row = (...) => ...`) and are not exported.
- A file may also export constants or types that belong to its component (e.g. `NUTRIENT_ROWS` in `nutrition-table.tsx`) as named exports.
- Props are a `type XxxProps = {...}` above the component, unless they are a single short inline type.
- `"use client"` only where the component needs state, effects, event handlers or browser APIs.
- Loading placeholders are components in `components/skeletons/`, never inline JSX in pages.

## Pages (smart / dumb)

Every `page.tsx` has the same shape:

```tsx
export default function XxxPage({ params, searchParams }: PageProps<"/xxx">) {
  return (
    <>
      {/* static shell: back button, PageHeader, links */}
      <Suspense fallback={<XxxSkeleton />}>
        <XxxLoader searchParams={searchParams} />
      </Suspense>
    </>
  );
}

// smart: what it reads
const XxxLoader = async ({ searchParams }: Pick<PageProps<"/xxx">, "searchParams">) => {
  const user = await requireUser();
  const data = await getSomething(user.id);
  return <XxxView {...data} />; // dumb component from components/<feature>/
};
```

- The page component is a static shell. Anything that reads `params`, `searchParams`, cookies or the session goes in a `XxxLoader` inside `<Suspense>` (required by `cacheComponents`).
- Loaders are **smart**: they read params and data and pass props. They are the only components defined inside `page.tsx`, and they are named `XxxLoader`.
- The UI they render is a **dumb** component in `components/<feature>/` that gets everything as props.

## Data

- **Reads** happen on the server, in loaders, through `lib/<feature>/queries.ts` (or `search.ts`, `settings.ts`).
- **Writes** go through API route handlers in `app/api/**/route.ts`, never Server Actions. Each handler checks the session with `getCurrentUser()` (401) and validates the body with Zod (`parseJsonBody`).
- After a write, the client component calls `router.refresh()` or navigates, so server components re-render with fresh data.

## Imports

ESLint (`import/order`) enforces these groups, each separated by a blank line and sorted alphabetically:

```ts
import { Plus } from "lucide-react"; //            1. packages (react, next, lucide, …)
import Link from "next/link";

import { requireUser } from "@/lib/auth/current-user"; //  2. @/lib and @/generated

import PageHeader from "@/components/page-header"; //    3. @/components

import type { Metadata } from "next"; //             4. type-only imports
```

- Always import through the `@/` alias, not relative paths (`./`, `../`).

## UI

- The app is Hebrew and right-to-left: use logical classes (`ps-`, `pe-`, `ms-`, `me-`, `start-`, `end-`, `text-start`), never `left`/`right`.
- Muted text: `text-foreground/60`. Errors: `text-red-600 dark:text-red-400`. Text on brand colour: `text-brand-foreground`.
- Empty lists and search hints use `<Hint>`; previous/next links use `<Pagination>`.
