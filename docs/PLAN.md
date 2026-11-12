# Bite Buddy — Build Plan

A mobile-first diet tracker. Users can scan or search foods, build meals, see nutrients per item and per meal, log what they eat, and track weekly macros.

Each step below is small enough for one branch or PR. Each one ends with a **Done when** check, so you can review it and adjust it before the next step starts.

---

## Stack (decided)

| Concern    | Choice                                                                                                                 |
| ---------- | ---------------------------------------------------------------------------------------------------------------------- |
| Framework  | Next.js 16 (App Router, Server Components for reads, API route handlers for writes), React 19, TypeScript              |
| Styling    | Tailwind CSS 4                                                                                                         |
| Database   | PostgreSQL (local via Docker) + Prisma ORM                                                                             |
| Auth       | Better Auth 1.7 (stable) + its Prisma adapter: Google sign-in only                                                     |
| Food data  | `seed/foodItems.json` (14,367 Open Food Facts products), plus an on-demand Open Food Facts lookup for unknown barcodes |
| Scanning   | Barcode only: native `BarcodeDetector`, with `@zxing/browser` as the fallback                                          |
| Validation | Zod                                                                                                                    |
| Charts     | Recharts                                                                                                               |
| Tests      | Vitest (domain logic), Playwright (key flows, later)                                                                   |
| PWA        | Last step                                                                                                              |

### Next.js 16 changes to keep in mind

- `middleware.ts` is now **`proxy.ts`** (export `proxy`, Node runtime only).
- `params`, `searchParams`, `cookies()` and `headers()` are **async** and must be awaited.
- Turbopack is the default bundler.
- Read the relevant guide in `node_modules/next/dist/docs/` before using an API.

---

## Seed data findings (they affect the design)

- 14,367 items, all with a unique `barcode`.
- Nutrients (`calories`, `proteins`, `carbohydrates`, `fat`, `sugars`, `fiber`, `saturatedFat`, `salt`, `sodium`) are Open Food Facts values **per 100 g/ml**. `salt` and `sodium` are in grams.
- **Only 6,238 items (43%) have all of kcal, protein, carbs and fat** after cleaning. We keep the rest, mark them `hasNutrition = false`, and let users fill in the missing values (Step 8). Impossible values (over 900 kcal or over 100 g of a macro per 100) are dropped, and kcal is derived from kJ when only kJ is given.
- `servingSize` is unreliable (for example, `15128`), so we don't trust it. `quantity` is free text in several languages and units (for example, `"5.5 oz (158 g)"`, `"6 x 30 g"`, `"500 גרם"`, `"0,514kg"`); we parse a package amount from it where we can (2,606 items).
- `brand`, `categories`, `allergens`, `labels`, `ingredients` and `traces` are arrays of `{ name }`. We store them as `string[]`.
- `images` lists many sizes. We keep the first `front_*.400.jpg` (or the first `*.400.jpg`) as `imageUrl`.
- Drinks are measured in ml. We set `unit = ML` when `quantity` is in ml, cl, l or fl oz, or, with no quantity, when a category is an explicit drink category (not broad ones like "plant based foods and beverages", and not dry ones like "instant coffees"). Otherwise we use `G`. Result: 532 ML items.

---

## Decisions

| Topic            | Decision                                                                                                                                             |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| What users track | Macros only for now: kcal, protein, carbs and fat. Logs also store fiber and sugar, so we can add them later without losing past data.               |
| Units            | Each food is either grams (`G`) or millilitres (`ML`), with nutrients per 100 of that unit. For meal totals, 1 ml counts as 1 g.                     |
| Meal sharing     | Each meal has a **Private / Public toggle** (private by default). Anyone signed in can browse public meals and save a copy. Only the owner can edit. |
| Week start       | A user setting, Sunday by default, changeable to Monday.                                                                                             |
| Sign-in          | Google only. No email sign-in, so no email service is needed. Email sign-in can be added later.                                                      |

---

## Data model (draft)

```
User / Session / Account / Verification       ← Better Auth core schema
User           (+ timezone, weekStartsOn (SUNDAY|MONDAY))
UserGoals      userId, kcal, proteinG, carbsG, fatG

Food           id, barcode? (unique), name, brands[], categories[], imageUrl,
               unit (G|ML), kcal100, protein100, carbs100, fat100, sugar100, fiber100,
               satFat100, salt100, sodium100, packageAmount?, nutritionGrade,
               novaGroup, allergens[], source (SEED|OFF|USER), createdById?,
               hasNutrition
Meal           id, userId, name, notes, visibility (PRIVATE|PUBLIC),
               copiedFromId?, createdAt                     ← reusable recipe/template
MealItem       id, mealId, foodId, amount                   ← in the food's unit (g or ml)

LogEntry       id, userId, eatenAt (timestamptz), mealType (BREAKFAST|LUNCH|DINNER|SNACK),
               foodId? | mealId?, amount? | servings?,
               kcal, protein, carbs, fat, fiber, sugar      ← snapshot at log time
```

**Why snapshot?** If a food or meal is edited later, past logs and weekly stats should stay the same.

Search uses Postgres `pg_trgm` with a GIN index on `Food.name` for fast fuzzy matching.

---

## Steps

### Step 0 — Project foundations

- Add Prettier, Vitest, a `.env.example`, and path aliases (`@/`).
- Folder layout:
  ```
  app/            routes (UI)
  lib/db.ts       Prisma singleton
  lib/nutrition/  pure nutrition math (unit tested)
  lib/food/       food queries, OFF client, seed normalizer
  components/     UI components
  prisma/         schema, migrations, seed.ts
  ```
- Base layout: a mobile app shell with bottom navigation (Today, Search, Scan, Meals, Stats).

**Done when:** `npm run lint`, `npm test` and `npm run build` pass, and the app shell shows on mobile width.

### Step 1 — Database + Prisma

- Add `docker-compose.yml` (Postgres 16 on host port **5433**, because the local Windows PostgreSQL 18 service already uses 5432), plus Prisma **7.10.1** (pinned: npm's `latest` tag for `prisma` points at an 8.0 RC). Prisma 7 uses `prisma.config.ts`, the `@prisma/adapter-pg` driver adapter, and a generated client in `generated/prisma` (gitignored, rebuilt on `postinstall`).
- Write the schema above, without the auth tables for now. Enable the `pg_trgm` extension and add the trigram index in a migration.
- Add `lib/db.ts` (a hot-reload-safe singleton).

**Done when:** `npx prisma migrate dev` creates the tables, and Prisma Studio shows them.

### Step 2 — Seed script

- Add `lib/food/normalize-seed.ts`, a pure function that maps a raw item to `Food`. It is unit tested and covers: missing nutrients, image selection, quantity parsing, g/ml detection and array flattening.
- `prisma/seed.ts` reads the JSON, normalizes it and inserts it with `createMany` in batches of about 1,000 (`skipDuplicates`). It is idempotent.
- Add the seed command to `migrations.seed` in `prisma.config.ts` (Prisma 7 no longer reads it from `package.json`), plus an `npm run db:seed` script.

**Done when:** the seed inserts 14,367 rows, re-running it adds none, and the normalizer tests pass.

### Step 3 — Authentication

- Better Auth with its Prisma adapter and the Google provider (create an OAuth client in Google Cloud Console, with redirect URI `http://localhost:3000/api/auth/callback/google`). Sessions are stored in the database, with a 5-minute signed cookie cache so most reads skip the database.
- Add `lib/auth/server.ts`, `lib/auth/client.ts`, `app/api/auth/[...all]/route.ts`, and `proxy.ts`. The proxy only checks that the session cookie exists (no database call) and redirects pages to `/sign-in` or returns 401 for `/api/*`.
- Add a sign-in page, sign-out, and a user menu. Sign-in and sign-out run in the browser through `authClient`, which calls the `/api/auth/*` route handlers (no Server Actions).
- Add a `TopBar` server component in `app/(root)/layout.tsx`: the logo, plus the user's avatar read with `getCurrentUser()` and wrapped in `<Suspense>` (needed because `cacheComponents` is on). Only the `UserMenu` dropdown is a client component. Page titles and page actions stay in each page's `PageHeader` (a server component).
- Add server helpers `getCurrentUser()` and `requireUser()` (`lib/auth/current-user.ts`) for pages and API route handlers.

**Done when:** you can sign in with Google, protected pages redirect, and the session persists.

### Step 4 — Nutrition domain logic (pure, tested)

- `lib/nutrition/`:
  - `scale(per100, amount)` scales nutrients to an amount in g or ml.
  - `sumNutrients(items[])` adds up a list of items.
  - `mealTotals(meal)` gives totals for a whole meal.
  - `perServing(meal, servings)` gives totals for a number of servings.
  - `macroSplit(n)` gives the percentage of calories from protein, carbs and fat (4/4/9 kcal per gram).
  - Missing-value rules: treat as `null` (unknown), not `0`, and show "incomplete" in the UI.
  - A rounding helper for display only.
- Add types such as `Nutrients` and `NutrientKey`.

**Done when:** there is full unit-test coverage of the edge cases (0 g, missing values, many items).

### Step 5 — Food search + food detail

- Add `lib/food/search.ts`: trigram plus `ILIKE` search on name and brand, ranked, and paginated (20 per page). It can filter to `hasNutrition`.
- Search page: a debounced input (state stored in the URL `?q=`) that renders results on the server.
- Food detail page `/food/[id]`:
  - A nutrition table per 100 g or 100 ml.
  - An **amount slider/input** (g or ml) that updates nutrients live (client component using `scale`).
  - Allergens, Nutri-Score and NOVA badges.
- Buttons: **Log it** (enabled in Step 9) and **Add to meal** (enabled in Step 7).

**Done when:** searching "peanut butter" returns relevant results quickly, and the detail page scales nutrients correctly.

### Step 6 — Barcode scanning

- A client component `<BarcodeScanner>` that:
  - Uses the `getUserMedia` rear camera with `BarcodeDetector` (EAN-13, EAN-8, UPC-A/E) when the browser supports it, and falls back to `@zxing/browser` (iOS Safari needs this).
  - Includes a torch toggle, debounces duplicate reads, and offers manual barcode entry as a fallback.
- Lookup flow `GET /api/foods/barcode/[code]`:
  1. Look the barcode up in the DB.
  2. If it is not found, fetch `https://world.openfoodfacts.org/api/v2/product/{code}`, normalize the result (reusing the Step 2 normalizer), save it with `source = OFF`, and return it.
  3. If Open Food Facts doesn't have it either, offer to **create a custom food**.
- The camera needs HTTPS. For local phone testing, use `next dev --experimental-https` and open your LAN IP.

**Done when:** on a real phone, scanning a seeded product opens its detail page, and an unseeded product is fetched and saved.

### Step 7 — Meals (builder)

- Pages: `/meals` (my meals), `/meals/new`, `/meals/[id]` (edit) and `/meals/public` (browse public meals).
- Search or scan to add items, set the amount (g or ml) per item, and remove or reorder items.
- Show live **per-ingredient nutrients** and **meal totals**, with a macro split donut.
- A **Private / Public toggle** on each meal (private by default).
- Public meals: anyone signed in can view them and **Save a copy** (sets `copiedFromId`). Only the owner can edit or delete.
- Use API route handlers (`app/api/meals/...`) for create, update, delete and toggle, with Zod validation and ownership checks.

**Done when:** you can build "Oatmeal + PB + milk (ml)", see correct per-item and total nutrients, and the meal persists. A public meal is visible to a second user and a private one isn't.

### Step 8 — Custom foods / complete missing data

- A form to create a food (name, optional barcode, unit g/ml, nutrients per 100 of that unit) with `source = USER`. It is visible only to its creator.
- For seeded items with no nutrition, offer **Add nutrition info**. This creates a user override and doesn't change the shared seed row.

**Done when:** a food with no data can be completed and then used in meals and logs.

### Step 9 — Food diary (logging)

- `/today` (home) has a date switcher and sections for Breakfast, Lunch, Dinner and Snacks.
- You can log a single food (g or ml) or a saved meal (servings). Nutrients are **snapshotted** into `LogEntry`.
- Show daily totals compared with goals (progress rings), and allow editing or deleting entries.
- Time zones: store `eatenAt` as UTC and group days in the user's time zone (saved on `User`, detected from the browser).

**Done when:** a logged food or meal appears under the correct day and section, and the totals are correct.

### Step 10 — Goals + weekly statistics

- Settings: daily goals for kcal, protein, carbs and fat (macros only for now), and the week start day (Sunday by default). Include an optional helper that suggests targets from weight, height, age and activity (Mifflin-St Jeor).
- `/stats`:
  - **This week**: a bar chart of daily calories against the goal line, a stacked bar of daily macros, and weekly totals and averages compared with targets.
  - **Trend**: the last 8–12 weeks of average kcal and macros.
  - **Insights**: top foods by calories, the number of days on target, and the logging streak.
- Aggregate with SQL (`date_trunc('week', eatenAt AT TIME ZONE tz)`). The week starts on the user's `weekStartsOn` setting.

**Done when:** the charts match the hand-calculated totals for a seeded test week.

### Step 11 — Polish & quality

- Loading, empty and error states (`loading.tsx`, `error.tsx`), plus optimistic UI on log, edit and delete.
- Accessibility pass, dark mode, and `next/image` remote patterns for `images.openfoodfacts.org`.
- Playwright E2E tests: sign in → search → build a meal → log it → see stats.

### Step 12 — PWA

- `app/manifest.ts`, icons, a service worker for an offline app shell, and caching of recent searches and foods.
- An install prompt, then a test of "Add to Home Screen" on Android and iOS.

### Step 13 — Deploy (optional)

- A hosted Postgres database (for example Neon or Azure Database for PostgreSQL), plus Vercel or Azure App Service.
- Run the migrations and seed in CI, and set the environment secrets (`BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `DATABASE_URL`). Add the production callback URL to the Google OAuth client.

---

## Later (not now)

- Goals and stats for fiber, sugar and sodium (the data is already stored).
- Household measures ("1 cup") and oz.
- Email sign-in (needs a domain or a dedicated sender mailbox).
