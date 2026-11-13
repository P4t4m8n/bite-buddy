# Bite Buddy — Build Plan

A mobile-first diet tracker in **Hebrew (RTL)**. Users can scan or search foods, build meals, see nutrients per item and per meal, log what they eat, and track weekly macros.

Each step below is small enough for one branch or PR. Each one ends with a **Done when** check, so you can review it and adjust it before the next step starts.

---

## Stack (decided)

| Concern    | Choice                                                                                                                                                  |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework  | Next.js 16 (App Router, Server Components for reads, API route handlers for writes), React 19, TypeScript                                               |
| Styling    | Tailwind CSS 4                                                                                                                                          |
| Database   | PostgreSQL (local via Docker) + Prisma ORM                                                                                                              |
| Auth       | Better Auth 1.7 (stable) + its Prisma adapter: Google sign-in only                                                                                      |
| Food data  | `seed/foodItems.json` (1,565 Open Food Facts products with Hebrew names and full macros), plus an on-demand Open Food Facts lookup for unknown barcodes |
| Scanning   | Barcode only: native `BarcodeDetector`, with `@zxing/browser` as the fallback                                                                           |
| Validation | Zod                                                                                                                                                     |
| Charts     | Recharts                                                                                                                                                |
| Tests      | Vitest (domain logic), Playwright (key flows, later)                                                                                                    |
| PWA        | Last step                                                                                                                                               |

### Next.js 16 changes to keep in mind

- `middleware.ts` is now **`proxy.ts`** (export `proxy`, Node runtime only).
- `params`, `searchParams`, `cookies()` and `headers()` are **async** and must be awaited.
- Turbopack is the default bundler.
- Read the relevant guide in `node_modules/next/dist/docs/` before using an API.

---

## Seed data findings (they affect the design)

- The original export had 14,367 items, all with a unique `barcode`. `npm run seed:clean` reduced the file (18 MB → 1.3 MB) to the **1,565 products with a Hebrew name and full macros**.
- Nutrients (`calories`, `proteins`, `carbohydrates`, `fat`, `sugars`, `fiber`, `saturatedFat`, `salt`, `sodium`) are Open Food Facts values **per 100 g/ml**. `salt` and `sodium` are in grams.
- **Only 6,238 of the original items (43%) had all of kcal, protein, carbs and fat**, and only 1,565 of those have Hebrew names. The seed and `npm run db:prune-foods` keep only Hebrew-named foods with full macros. New foods are added as needed (barcode lookups and custom foods). Impossible values (over 900 kcal or over 100 g of a macro per 100) are dropped, kcal is derived from kJ when only kJ is given, and sodium from salt (÷ 2.5) when only salt is given.
- `servingSize` is unreliable (for example, `15128`), so we don't trust it. `quantity` is free text in several languages and units (for example, `"5.5 oz (158 g)"`, `"6 x 30 g"`, `"500 גרם"`, `"0,514kg"`); we parse a package amount from it where we can (2,606 items).
- `brand`, `categories`, `allergens`, `labels`, `ingredients` and `traces` are arrays of `{ name }`. We store them as `string[]`.
- `images` lists many sizes. We keep the first `front_*.400.jpg` (or the first `*.400.jpg`) as `imageUrl`.
- Drinks are measured in ml. We set `unit = ML` when `quantity` is in ml, cl, l or fl oz, or, with no quantity, when a category is an explicit drink category (not broad ones like "plant based foods and beverages", and not dry ones like "instant coffees"). Otherwise we use `G`. Result: 532 ML items.

---

## Decisions

| Topic            | Decision                                                                                                                                                                            |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| What users track | Goals are macros only for now: kcal, protein, carbs and fat. Foods, meal totals and logs also track fiber, sugar, saturated fat and sodium (shown in mg).                           |
| Units            | Each food is either grams (`G`) or millilitres (`ML`), with nutrients per 100 of that unit. For meal totals, 1 ml counts as 1 g.                                                    |
| Meal sharing     | Each meal has a **Private / Public toggle** (private by default). Anyone signed in can browse public meals and save a copy. Only the owner can edit.                                |
| Week start       | A user setting, Sunday by default, changeable to Monday.                                                                                                                            |
| Sign-in          | Google only. No email sign-in, so no email service is needed. Email sign-in can be added later.                                                                                     |
| Language         | Hebrew only, RTL (`<html lang="he" dir="rtl">`), Heebo font. Use logical CSS (`ps`/`pe`, `start`/`end`, `text-start`) instead of left/right. Hebrew units: קק״ל, ג׳, מ״ג, גרם, מ״ל. |
| Products         | Shared foods must have a Hebrew name (`hasHebrew`) and full macros.                                                                                                                 |

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
               kcal, protein, carbs, fat, fiber, sugar,
               satFat, sodium                               ← snapshot at log time
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
- `prisma/seed.ts` reads the JSON, normalizes it, skips foods without full macros, and inserts the rest with `createMany` in batches of about 1,000 (`skipDuplicates`). It is idempotent.
- `prisma/prune-foods.ts` (`npm run db:prune-foods [-- --dry-run]`) deletes shared (seed / Open Food Facts) foods without full macros or without a Hebrew name, except foods used in saved meals.
- `prisma/clean-seed-file.ts` (`npm run seed:clean [-- --dry-run]`) rewrites `seed/foodItems.json` with the same rules.
- Add the seed command to `migrations.seed` in `prisma.config.ts` (Prisma 7 no longer reads it from `package.json`), plus an `npm run db:seed` script.

**Done when:** the seed inserts the 1,565 Hebrew foods with full macros, re-running it adds none, and the normalizer tests pass.

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
  - `mealNutrition(items)` gives per-item nutrients, meal totals and the total amount.
  - `multiply(nutrients, servings)` gives totals for a number of servings.
  - `macroSplit(n)` gives the percentage of calories from protein, carbs and fat (4/4/9 kcal per gram).
  - Missing-value rules: a single food keeps `null` (unknown), not `0`. A total sums the known values and lists the nutrient in `incomplete` when some items lack it (the UI shows "incomplete"); it is `null` only when no item has it.
  - `roundNutrient` / `formatNutrient` for display only (`format.ts`).
- Add types such as `Nutrients` and `NutrientKey`.

**Done when:** there is full unit-test coverage of the edge cases (0 g, missing values, many items).

### Step 5 — Food search + food detail

- Add `lib/food/search.ts`: trigram plus `ILIKE` search on name and brand, ranked, and paginated (20 per page).
- Search page: a debounced input (state stored in the URL `?q=`) that renders results on the server.
- `GET /api/foods?q=&page=` returns the same search as JSON for client components (the Step 7 meal builder). It returns 401 JSON without a session.
- Food images load directly from Open Food Facts (`unoptimized`, with a placeholder on error): their CDN can take 10–20 s, which made the Next.js image optimizer time out.
- Food detail page `/food/[id]`:
  - A nutrition table per 100 g or 100 ml.
  - An **amount slider/input** (g or ml) that updates nutrients live (client component using `scale`).
  - Allergens, Nutri-Score and NOVA badges.
- Buttons: **Log it** (enabled in Step 9) and **Add to meal** (enabled in Step 7).

**Done when:** searching "peanut butter" returns relevant results quickly, and the detail page scales nutrients correctly.

### Step 6 — Barcode scanning

- A client component `<BarcodeScanner>` (`components/scan/barcode-scanner.tsx`) on `/scan` that:
  - Uses the `getUserMedia` rear camera with `BarcodeDetector` (EAN-13, EAN-8, UPC-A/E) when the browser supports it, and falls back to `@zxing/browser` (iOS Safari needs this), loaded with a dynamic `import()` only when needed (`lib/scan/barcode-detection.ts`).
  - Includes a torch toggle (when the camera track supports it), ignores the same code for 3 s and while a lookup is shown, stops the camera on unmount, and always shows a **manual barcode entry** form.
  - Explains each camera state in Hebrew: requesting permission, permission denied, no camera, camera busy, no browser support, and insecure context (HTTP).
- Lookup flow `GET /api/foods/barcode/[code]` (401 without a session, 400 unless the code is 8–14 digits):
  1. Look the barcode up in the DB among the foods the user may see (a 12-digit UPC-A also matches its 13-digit form with a leading 0).
  2. If it is not found, fetch `https://world.openfoodfacts.org/api/v2/product/{code}?fields=…` (only the mapped fields, a `BiteBuddy/0.1` User-Agent, 8 s timeout) and normalize the result: `lib/food/open-food-facts.ts` maps the OFF product to the seed shape (preferring `product_name_he`) and reuses the Step 2 normalizer. If it has full macros and a Hebrew name (so `db:prune-foods` keeps it), save it with `source = OFF` (`createMany` with `skipDuplicates`, so two parallel scans of the same barcode don't fail) and return `{ status: "found", food }`.
  3. Otherwise return `{ status: "incomplete", prefill }` (whatever is known) or `{ status: "not_found", barcode }` (`offUnavailable: true` when Open Food Facts can't be reached). The scanner then links **יצירת מוצר** to `/foods/new?barcode=…&name=…&unit=…&kcal100=…` (Step 8 builds that page).
  - Edge case: if another user's custom food already holds the barcode (barcodes are unique), the OFF product can't be saved and is returned as `incomplete`.
- The camera needs HTTPS. For local phone testing, use `next dev --experimental-https` and open your LAN IP.
- E2E tests use the manual entry form and deny the camera (headless browsers have none), so the scan page snapshot shows the fallback state. The Open Food Facts path is covered by unit tests with an injected `fetch`.

**Done when:** on a real phone, scanning a seeded product opens its detail page, and an unseeded product is fetched and saved.

### Step 7 — Meals (builder)

- Pages: `/meals` (my meals), `/meals/new`, `/meals/[id]` (edit) and `/meals/public` (browse public meals).
- Search or scan to add items, set the amount (g or ml) per item, and remove or reorder items.
- Show live **per-ingredient nutrients** and **meal totals**, with a macro split donut.
- A **Private / Public toggle** on each meal (private by default).
- Public meals: anyone signed in can view them and **Save a copy** (sets `copiedFromId`). Only the owner can edit or delete.
- Use API route handlers (`app/api/meals/...`) for create, update, delete and toggle, with Zod validation and ownership checks.
- Built: `GET/POST /api/meals`, `PATCH/DELETE /api/meals/[id]`, `POST /api/meals/[id]/copy`, `POST /api/meals/[id]/items` (append from the food page's "הוספה לארוחה" dialog). Someone else's public meal → 403 on writes; a private one → 404. Reordering uses up/down buttons.

**Done when:** you can build "Oatmeal + PB + milk (ml)", see correct per-item and total nutrients, and the meal persists. A public meal is visible to a second user and a private one isn't.

### Step 8 — Custom foods

- A form to create a food (name, optional barcode, unit g/ml, nutrients per 100 of that unit) with `source = USER`. kcal, protein, carbs and fat are required; fiber, sugar, saturated fat and sodium are optional. It is visible only to its creator.
- When a scanned barcode is missing or incomplete on Open Food Facts, open this form prefilled with whatever is known.
- Built: `/foods/new` (prefill from the URL), `POST /api/foods`, and a "לא מצאתם? הוספת מוצר חדש" link on search. Sodium is entered in mg. Values are checked (protein + carbs + fat ≤ 100, sugar ≤ carbs, saturated fat ≤ fat). A barcode the user can already see returns 409 with a link to that food; a barcode held by another user's private food is dropped from the new food. Editing or deleting custom foods is not built yet.

**Done when:** a custom food can be created (also from a failed scan) and then used in meals and logs.

### Step 9 — Food diary (logging)

- `/today` (home) has a date switcher and sections for Breakfast, Lunch, Dinner and Snacks.
- You can log a single food (g or ml) or a saved meal (servings). Nutrients are **snapshotted** into `LogEntry`.
- Show daily totals compared with goals (progress rings), and allow editing or deleting entries.
- Time zones: store `eatenAt` as UTC and group days in the user's time zone (saved on `User`, detected from the browser).
- Built: the home page `/` (`?date=YYYY-MM-DD` for other days), `POST /api/log`, `PATCH/DELETE /api/log/[id]`, `PATCH /api/me` (time zone, week start). A "הוספה ליומן" dialog (day, meal, servings for meals) on the food page and meal pages. Progress bars instead of rings. Editing an amount scales the stored snapshot, so it stays right after the food or meal changes. Entries logged for today use the current time; other days use local noon.

**Done when:** a logged food or meal appears under the correct day and section, and the totals are correct.

### Step 10 — Goals + weekly statistics

- Settings: daily goals for kcal, protein, carbs and fat (macros only for now), and the week start day (Sunday by default). Include an optional helper that suggests targets from weight, height, age and activity (Mifflin-St Jeor).
- `/stats`:
  - **This week**: a bar chart of daily calories against the goal line, a stacked bar of daily macros, and weekly totals and averages compared with targets.
  - **Trend**: the last 8–12 weeks of average kcal and macros.
  - **Insights**: top foods by calories, the number of days on target, and the logging streak.
- Aggregate with SQL (`date_trunc('week', eatenAt AT TIME ZONE tz)`). The week starts on the user's `weekStartsOn` setting.
- Built differently: entries for the needed range (8 trend weeks, 120 days for the streak) are loaded once and grouped by local day in pure, tested JS (`lib/stats/aggregate.ts`) instead of SQL; the data per user is small. Averages count only days with entries. "On target" means within ±10% of the calorie goal. `/settings` (from the user menu) holds goals (`PUT /api/me/goals`) with a Mifflin-St Jeor helper (protein 1.8 g/kg, fat 25%), and the week start. `/stats?week=` shows any past week.

**Done when:** the charts match the hand-calculated totals for a seeded test week.

### Step 11 — Polish & quality

- Loading, empty and error states (`loading.tsx`, `error.tsx`), plus optimistic UI on log, edit and delete.
- Accessibility pass and dark mode.
- Playwright E2E tests: sign in → search → build a meal → log it → see stats.
- Built: Hebrew `error.tsx` / `global-error.tsx` (loading states were already Suspense skeletons). An axe scan (`e2e/a11y.spec.ts`) checks the main screens in light and dark mode for serious WCAG A/AA issues; fixing contrast changed the brand green to `#15803d` and added `brand-foreground` for text on brand backgrounds. `e2e/journey.spec.ts` covers the full path. Optimistic UI was skipped: writes are fast and refresh the page.

### Step 12 — PWA

- `app/manifest.ts`, icons, a service worker for an offline app shell, and caching of recent searches and foods.
- An install prompt, then a test of "Add to Home Screen" on Android and iOS.
- Built: `app/manifest.ts` (Hebrew, RTL, shortcuts to scan and search), icons generated by `npm run icons` (sharp), and a hand-written `public/sw.js`, registered only in production builds. Pages are network-first with a cached fallback, then `/offline`; build assets and icons are cache-first; `GET /api/foods` is network-first. Other APIs are never cached, and cached pages are cleared on sign-out. Security headers come from the Next.js PWA guide. The install card on `/settings` uses `beforeinstallprompt`, or shows iOS instructions. Logging while offline (a queue to sync later) is not built.

### Step 13 — Deploy (Vercel + Neon)

- A hosted Postgres database (for example Neon or Azure Database for PostgreSQL), plus Vercel or Azure App Service.
- Run the migrations and seed in CI, and set the environment secrets (`BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `DATABASE_URL`). Add the production callback URL to the Google OAuth client.
- Prepared in code: Vercel runs `npm run vercel-build` (`prisma migrate deploy && next build`), so every deploy applies new migrations. The Prisma CLI uses `DIRECT_URL` when set (Neon's unpooled address); the app uses the pooled `DATABASE_URL`. Node ≥ 22.12 is set in `engines`. `.github/workflows/ci.yml` runs format check, lint, typecheck, unit tests and build on each push (E2E needs a database and runs locally).

**Checklist**

1. **Neon:** create a project (region close to your users, e.g. Frankfurt). Copy the **pooled** connection string (host contains `-pooler`) → `DATABASE_URL`, and the **direct** one → `DIRECT_URL`.
2. **Seed once from your PC:** set both in a temporary shell (not in `.env`), then run `npx prisma migrate deploy` and `npm run db:seed`.
3. **Vercel:** import the GitHub repo. In Environment Variables (Production) set `DATABASE_URL`, `DIRECT_URL`, `BETTER_AUTH_SECRET` (new: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`), `BETTER_AUTH_URL` (`https://<your-domain>`), `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`. Deploy.
4. **Google Cloud Console:** add `https://<your-domain>/api/auth/callback/google` to the OAuth client's redirect URIs, and publish the consent screen (in "Testing" only listed users can sign in).
5. **Check:** sign in, search, scan on a phone (HTTPS now works without extra flags), install the app, and log a meal.

**Demo account:** the sign-in page also has a `כניסה למשתמש דמו` button for people who don't want to share their Google email or image. It signs everyone in to one shared user (`demo@bite-buddy.invalid`, created on first use by the Better Auth plugin in `lib/auth/demo-login.ts`), so they all see the same diary, goals and private meals. No setup needed in production.

Preview deployments get the same variables only if you add them for "Preview". With the same database, a preview deploy would also run migrations on production, so give previews their own Neon branch or don't set the database variables for Preview.

---

## Later (not now)

- Goals for fiber, sugar, saturated fat and sodium (the data is already tracked).
- Household measures ("1 cup") and oz.
- Email sign-in (needs a domain or a dedicated sender mailbox).
