# Component hierarchy

One tree per feature, from the route down to the smallest component, so you can follow each part of the app.

**Legend**

- `(S)` server component: reads data on the server and renders HTML. No state, no event handlers.
- `(C)` client component: has `"use client"`, holds state, handles clicks and calls the API.
- `◆ lib/...` the server function a loader uses to read data (e.g. `◆ meals/queries.listMyMeals`).
- `⇢ METHOD /api/...` the API route a client component calls to write data. After a write, the component calls `router.refresh()` or navigates, so the server parts re-render.
- `⟨Suspense⟩` a loading boundary; its fallback skeleton is shown in brackets.

**Pattern used everywhere ("smart" and "dumb")**

```
page.tsx (S)                 static shell: header, back button
└─ ⟨Suspense: Skeleton⟩
   └─ XxxLoader (S)          smart: reads params, session and data (◆)
      └─ XxxView / Form      dumb: gets everything as props
         └─ action buttons (C) ⇢ /api/...
```

A component without `"use client"` that is imported by a client component (e.g. `FoodPicker` inside `MealEditor`) also runs on the client. The trees mark these `(C*)`.

---

## App shell (every page)

```
app/layout.tsx  RootLayout (S)                       <html lang="he" dir="rtl">
├─ ServiceWorkerRegister (C)                         components/pwa/service-worker-register.tsx
└─ app/(root)/layout.tsx  AppLayout (S)              pages that need a signed-in user
   ├─ TopBar (S)                                     components/top-bar.tsx
   │  └─ ⟨Suspense: avatar placeholder⟩
   │     └─ CurrentUserMenu (S)  ◆ auth/current-user.getCurrentUser
   │        └─ UserMenu (C)                          components/user-menu.tsx
   │           ├─ Avatar (C*)                        components/avatar.tsx
   │           └─ sign out: authClient.signOut() + clearUserCache()
   ├─ {page}
   └─ BottomNav (C)                                  components/bottom-nav.tsx
      └─ ⟨Suspense⟩ ActiveNavItems → NavItems        היום · חיפוש · סריקה · ארוחות · סטטיסטיקה

Also: app/(root)/error.tsx AppError (C), app/global-error.tsx (C), app/not-found.tsx (S)
proxy.ts sends signed-out visitors to /sign-in?callbackUrl=... (cookie check only)
```

## 1. Sign-in

```
/sign-in   app/(auth)/sign-in/page.tsx  SignInPage (S)       layout: app/(auth)/layout.tsx
└─ ⟨Suspense: disabled buttons⟩
   └─ SignInForm (S)  ◆ auth/current-user.getCurrentUser    signed in → redirect to callbackUrl
      ├─ GoogleSignInButton (C)   ⇢ authClient.signIn.social (Better Auth → Google)
      └─ DemoSignInButton (C)     ⇢ POST /api/auth/demo/sign-in  (plugin: lib/auth/demo-login.ts)
```

## 2. Today (diary)

```
/  (?date=YYYY-MM-DD)   app/(root)/(home)/page.tsx  Homepage (S)
└─ ⟨Suspense: DiarySkeleton⟩
   └─ DiaryLoader (S)  ◆ diary/queries.getDiaryDay
      ├─ TimezoneSync (C)            ⇢ PATCH /api/me  (saves the browser's time zone)
      ├─ DayNavigator (S)            previous / next day links, "חזרה להיום"
      ├─ DailySummary (S)            calories and macros vs. goals
      │  └─ MacroSplitBar (S)
      └─ MealSection (S) ×4          breakfast · lunch · dinner · snacks
         ├─ LogEntryRow (C) ×n       ⇢ PATCH / DELETE /api/log/[id]  (edit amount/servings, delete)
         │  └─ MacroLine (C*)
         └─ "הוספה" link → /diary/add?date=…&meal=…
```

### 2a. Add to a diary section

```
/diary/add?date=…&meal=…(&q=…)   app/(root)/diary/add/page.tsx  AddToDiaryPage (S)
├─ BackButton (C)
└─ ⟨Suspense: MealListSkeleton⟩
   └─ AddToDiaryLoader (S)  ◆ meals/queries.listMyMeals, user/settings.getUserSettings
      ├─ PageHeader (S)                  "הוספה לארוחת צהריים" + day
      ├─ QuickLink ×2 (S)                → /search, → /scan
      ├─ SearchInput (C)                 writes ?q= to the URL
      └─ AddMealList (C)                 ⇢ POST /api/log  (1 serving), then back to the diary
         └─ MacroLine (C*)
```

## 3. Food search

```
/search?q=…&page=…   app/(root)/search/page.tsx  SearchPage (S)
├─ PageHeader (S)
├─ ⟨Suspense⟩ SearchInput (C)            writes ?q= to the URL after 300 ms
└─ ⟨Suspense: ResultsSkeleton⟩
   └─ SearchResults (S)  ◆ food/search.searchFoods
      ├─ FoodListItem (S) ×n → /food/[id]
      │  └─ FoodImage (C)
      ├─ NewFoodLink (S)                 → /foods/new?name=…
      └─ previous / next page links
```

## 4. Scan a barcode

```
/scan   app/(root)/scan/page.tsx  ScanPage (S)
├─ PageHeader (S)
└─ BarcodeScanner (C)                    ⇢ GET /api/foods/barcode/[code]  → /food/[id]
   ├─ CameraView                         @zxing/browser on the camera stream
   │  └─ ScanFrame
   ├─ CameraMessage                      no camera / permission denied
   ├─ LookupStatus                       searching / not found / incomplete → "יצירת מוצר" (/foods/new?barcode=…)
   └─ ManualBarcodeForm (C)              type the barcode instead
```

## 5. Food page

```
/food/[id]   app/(root)/food/[id]/page.tsx  FoodPage (S)
├─ BackButton (C)
└─ ⟨Suspense: FoodSkeleton⟩
   └─ FoodLoader (S)  ◆ food/search.getVisibleFood          missing → notFound()
      └─ FoodDetails (S)                 components/FoodDetails.tsx (dumb: gets `food`)
         ├─ Header
         │  ├─ FoodImage (C)
         │  └─ NutriScoreBadge, NovaBadge (S)
         ├─ FoodAmountActions (C)        holds the chosen amount
         │  ├─ FoodAmountCalculator (C)  quick amounts + custom amount
         │  │  ├─ MacroSplitBar (C*)
         │  │  └─ NutritionTable (C*)
         │  ├─ LogButton (C)             dialog: day + meal → ⇢ POST /api/log
         │  │  └─ Toast (C*)
         │  └─ AddToMealButton (C)       ⇢ GET /api/meals, POST /api/meals/[id]/items or POST /api/meals
         │     ├─ MealChoices
         │     └─ Toast (C*)
         └─ Allergens
```

## 6. Custom food

```
/foods/new?name=…&barcode=…   app/(root)/foods/new/page.tsx  NewFoodPage (S)
├─ BackButton (C)
└─ ⟨Suspense: MealEditorSkeleton⟩
   └─ NewFoodLoader (S)  ◆ food/custom-food.prefillFromSearchParams
      └─ CustomFoodForm (C)              ⇢ POST /api/foods  → /food/[id]
         ├─ Field
         └─ NumberInput
```

## 7. Meals

### 7a. My meals

```
/meals?q=…   app/(root)/meals/page.tsx  MealsPage (S)
├─ PageHeader (S) + "ארוחה חדשה" link → /meals/new
├─ link → /meals/public
├─ ⟨Suspense⟩ SearchInput (C)           "חיפוש ארוחה"
└─ ⟨Suspense: MealListSkeleton⟩
   └─ MyMealsLoader (S)  ◆ meals/queries.listMyMeals
      └─ MyMealsList (S)
         └─ MealCard (S) ×n → /meals/[id]
            ├─ VisibilityBadge (S)
            └─ MacroLine (S)
```

### 7b. Public meals

```
/meals/public?q=…&page=…   app/(root)/meals/public/page.tsx  PublicMealsPage (S)
├─ BackButton (C), PageHeader (S)
├─ ⟨Suspense⟩ SearchInput (C)           "חיפוש ארוחה ציבורית"
└─ ⟨Suspense: MealListSkeleton⟩
   └─ PublicMealsLoader (S)  ◆ meals/queries.listPublicMeals
      └─ PublicMealsList (S)
         └─ MealCard (S) ×n  (shows "מאת {owner}")
```

### 7c. One meal (owner edits, others view)

```
/meals/[id]   app/(root)/meals/[id]/page.tsx  MealPage (S)
├─ BackButton (C)
└─ ⟨Suspense: MealEditorSkeleton⟩
   └─ MealLoader (S)  ◆ meals/queries.getVisibleMeal        private & not yours → notFound()
      ├─ meal.isOwner → MealEditor (C)                       see 7d
      └─ otherwise    → MealView (S)
                        ├─ FoodImage (C) per item, MacroLine (S)
                        ├─ MealTotals (S)
                        │  ├─ MacroSplitBar, NutritionTable
                        ├─ LogButton (C)        ⇢ POST /api/log
                        └─ CopyMealButton (C)   ⇢ POST /api/meals/[id]/copy → /meals/[newId]
```

### 7d. Meal editor (new and existing)

```
/meals/new   app/(root)/meals/new/page.tsx  NewMealPage (S)
└─ ⟨Suspense⟩ NewMealLoader (S)  ◆ auth/current-user.requireUser
   └─ MealEditor (C)

MealEditor (C)                           components/meals/meal-editor.tsx
│  save ⇢ POST /api/meals (new) or PATCH /api/meals/[id];  delete ⇢ DELETE /api/meals/[id]
├─ name, notes, VisibilitySwitch (C*)    private / public toggle
├─ FoodPicker (C*)                       ⇢ GET /api/foods?q=…  (adds an item)
│  └─ Results → FoodImage
├─ MealItemRow (C*) ×n                   amount, move up/down, remove
│  ├─ FoodImage, MacroLine
│  └─ IconButton
├─ MealTotals (C*)
│  ├─ MacroSplitBar
│  └─ NutritionTable
└─ LogButton (C)                         outside the <form> (a dialog's submit would bubble into it)
```

## 8. Stats

```
/stats   app/(root)/stats/page.tsx  StatsPage (S)
├─ PageHeader (S)
└─ ⟨Suspense: DiarySkeleton⟩
   └─ StatsLoader (S)  ◆ stats/queries.getWeeklyStats  (sums in lib/stats/aggregate.ts)
      └─ StatsView (S)                   weekly averages vs. goals
         ├─ CaloriesChart (C)            components/stats/charts.tsx (Recharts)
         ├─ MacrosChart (C)
         └─ TrendChart (C)
```

## 9. Settings and goals

```
/settings   app/(root)/settings/page.tsx  SettingsPage (S)
├─ PageHeader (S)
└─ ⟨Suspense: MealEditorSkeleton⟩
   └─ SettingsLoader (S)  ◆ user/settings.getUserSettings
      ├─ GoalsForm (C)                   ⇢ PUT /api/me/goals
      │  └─ GoalCalculator               suggests goals from body data
      ├─ WeekStartSetting (C)            ⇢ PATCH /api/me
      └─ InstallApp (C)                  PWA install prompt
```

## 10. Offline and PWA

```
public/sw.js                 service worker (pages network-first → cache → /offline)
app/manifest.ts              web app manifest
app/offline/page.tsx         OfflinePage (S)
ServiceWorkerRegister (C)    registers sw.js in production; clearUserCache() on sign-out
```

---

## Shared building blocks

| Component         | Used by                                                       |
| ----------------- | ------------------------------------------------------------- |
| `PageHeader` (S)  | search, scan, meals, public meals, diary add, stats, settings |
| `BackButton` (C)  | food, new food, meal, new meal, public meals, diary add       |
| `SearchInput` (C) | search, meals, public meals, diary add                        |
| `FoodImage` (C)   | FoodListItem, FoodDetails, FoodPicker, MealItemRow, MealView  |
| `MacroLine`       | MealCard, MealItemRow, MealView, LogEntryRow, AddMealList     |
| `MacroSplitBar`   | DailySummary, FoodAmountCalculator, MealTotals                |
| `NutritionTable`  | FoodAmountCalculator, MealTotals                              |
| `LogButton` (C)   | FoodAmountActions, MealEditor, MealView                       |
| `Toast`           | LogButton, AddToMealButton                                    |
| Skeletons         | `components/skeletons/*` as Suspense fallbacks                |

## Where the data comes from

| Read (server, `◆`)         | Write (client, `⇢`)                                               |
| -------------------------- | ----------------------------------------------------------------- |
| `lib/diary/queries.ts`     | `app/api/log/route.ts`, `app/api/log/[id]/route.ts`               |
| `lib/food/search.ts`       | `app/api/foods/route.ts`, `app/api/foods/barcode/[code]/route.ts` |
| `lib/meals/queries.ts`     | `app/api/meals/**/route.ts`                                       |
| `lib/stats/queries.ts`     | —                                                                 |
| `lib/user/settings.ts`     | `app/api/me/route.ts`, `app/api/me/goals/route.ts`                |
| `lib/auth/current-user.ts` | `app/api/auth/[...all]/route.ts` (Better Auth)                    |

Every API route checks the session with `getCurrentUser()` (401 if missing) and validates the body with Zod.
