# Component diagrams

The same hierarchy as [COMPONENTS.md](./COMPONENTS.md), drawn as diagrams. GitHub renders them; in VS Code, install the "Markdown Preview Mermaid Support" extension and open the Markdown preview.

**Colours**

```mermaid
flowchart LR
  P["Page (route)"]:::page
  S["Server component"]:::server
  C["Client component"]:::client
  D[("lib read function")]:::data
  A{{"API route (write)"}}:::api
  P --> S --> C
  S -.reads.-> D
  C -.calls.-> A
  classDef page fill:#1f2937,color:#fff,stroke:#111
  classDef server fill:#dcfce7,color:#14532d,stroke:#15803d
  classDef client fill:#dbeafe,color:#1e3a8a,stroke:#2563eb
  classDef data fill:#f3e8ff,color:#581c87,stroke:#9333ea
  classDef api fill:#ffedd5,color:#7c2d12,stroke:#ea580c
```

Solid arrows: "renders". Dotted arrows: reads data / calls the API. Dashed boxes are `<Suspense>` boundaries.

---

## App overview

```mermaid
flowchart TD
  Root["app/layout.tsx<br/>RootLayout"]:::page
  Root --> SW["ServiceWorkerRegister"]:::client
  Root --> Auth["(auth)/layout"]:::page
  Root --> App["(root)/layout<br/>AppLayout"]:::page
  Auth --> SignIn["/sign-in"]:::page

  App --> TopBar["TopBar"]:::server
  App --> Pages{{"page"}}
  App --> BottomNav["BottomNav"]:::client

  Pages --> Home["/ Today"]:::page
  Pages --> Add["/diary/add"]:::page
  Pages --> Search["/search"]:::page
  Pages --> Scan["/scan"]:::page
  Pages --> Food["/food/[id]"]:::page
  Pages --> NewFood["/foods/new"]:::page
  Pages --> Meals["/meals"]:::page
  Pages --> Public["/meals/public"]:::page
  Pages --> Meal["/meals/[id]"]:::page
  Pages --> NewMeal["/meals/new"]:::page
  Pages --> Stats["/stats"]:::page
  Pages --> Settings["/settings"]:::page

  Home -- "הוספה" --> Add
  Add --> Search
  Add --> Scan
  Search --> Food
  Search --> NewFood
  Scan --> Food
  Scan --> NewFood
  Meals --> Meal
  Meals --> NewMeal
  Meals --> Public
  Public --> Meal

  classDef page fill:#1f2937,color:#fff,stroke:#111
  classDef server fill:#dcfce7,color:#14532d,stroke:#15803d
  classDef client fill:#dbeafe,color:#1e3a8a,stroke:#2563eb
```

## App shell

```mermaid
flowchart TD
  AppLayout["AppLayout<br/>app/(root)/layout.tsx"]:::page
  AppLayout --> TopBar["TopBar"]:::server
  AppLayout --> BottomNav["BottomNav"]:::client
  subgraph S1 ["Suspense: avatar placeholder"]
    CUM["CurrentUserMenu"]:::server
  end
  TopBar --> CUM
  CUM -.-> getCurrentUser[("auth/current-user<br/>getCurrentUser")]:::data
  CUM --> UserMenu["UserMenu"]:::client
  UserMenu --> Avatar["Avatar"]:::client
  UserMenu -.sign out.-> BA{{"Better Auth<br/>signOut + clearUserCache"}}:::api
  BottomNav --> NavItems["NavItems<br/>היום · חיפוש · סריקה · ארוחות · סטטיסטיקה"]:::client

  classDef page fill:#1f2937,color:#fff,stroke:#111
  classDef server fill:#dcfce7,color:#14532d,stroke:#15803d
  classDef client fill:#dbeafe,color:#1e3a8a,stroke:#2563eb
  classDef data fill:#f3e8ff,color:#581c87,stroke:#9333ea
  classDef api fill:#ffedd5,color:#7c2d12,stroke:#ea580c
  style S1 stroke-dasharray: 5 5
```

## 1. Sign-in

```mermaid
flowchart TD
  Page["/sign-in<br/>SignInPage"]:::page
  subgraph S1 ["Suspense: disabled buttons"]
    Form["SignInForm"]:::server
  end
  Page --> Form
  Form -.signed in → redirect.-> D1[("auth/current-user<br/>getCurrentUser")]:::data
  Form --> Google["GoogleSignInButton"]:::client
  Form --> Demo["DemoSignInButton"]:::client
  Google -.-> A1{{"signIn.social → Google"}}:::api
  Demo -.-> A2{{"POST /api/auth/demo/sign-in"}}:::api

  classDef page fill:#1f2937,color:#fff,stroke:#111
  classDef server fill:#dcfce7,color:#14532d,stroke:#15803d
  classDef client fill:#dbeafe,color:#1e3a8a,stroke:#2563eb
  classDef data fill:#f3e8ff,color:#581c87,stroke:#9333ea
  classDef api fill:#ffedd5,color:#7c2d12,stroke:#ea580c
  style S1 stroke-dasharray: 5 5
```

## 2. Today (diary)

```mermaid
flowchart TD
  Page["/ ?date=<br/>Homepage"]:::page
  subgraph S1 ["Suspense: DiarySkeleton"]
    Loader["DiaryLoader"]:::server
  end
  Page --> Loader
  Loader -.-> D1[("diary/queries<br/>getDiaryDay")]:::data
  Loader --> TZ["TimezoneSync"]:::client
  Loader --> Nav["DayNavigator"]:::server
  Loader --> Sum["DailySummary"]:::server
  Loader --> Sec["MealSection ×4<br/>בוקר · צהריים · ערב · נשנושים"]:::server
  Sum --> Bar["MacroSplitBar"]:::server
  Sec --> Row["LogEntryRow ×n"]:::client
  Sec -- "הוספה link" --> AddPage["/diary/add"]:::page
  Row --> ML["MacroLine"]:::client
  TZ -.-> A1{{"PATCH /api/me"}}:::api
  Row -.edit / delete.-> A2{{"PATCH, DELETE /api/log/[id]"}}:::api

  classDef page fill:#1f2937,color:#fff,stroke:#111
  classDef server fill:#dcfce7,color:#14532d,stroke:#15803d
  classDef client fill:#dbeafe,color:#1e3a8a,stroke:#2563eb
  classDef data fill:#f3e8ff,color:#581c87,stroke:#9333ea
  classDef api fill:#ffedd5,color:#7c2d12,stroke:#ea580c
  style S1 stroke-dasharray: 5 5
```

### 2a. Add to a diary section

```mermaid
flowchart TD
  Page["/diary/add ?date= &meal= &q=<br/>AddToDiaryPage"]:::page
  Page --> Back["BackButton"]:::client
  subgraph S1 ["Suspense: MealListSkeleton"]
    Loader["AddToDiaryLoader"]:::server
  end
  Page --> Loader
  Loader -.-> D1[("meals/queries.listMyMeals<br/>user/settings.getUserSettings")]:::data
  Loader --> Header["PageHeader"]:::server
  Loader --> Quick["QuickLink ×2"]:::server
  Loader --> SI["SearchInput"]:::client
  Loader --> List["AddMealList"]:::client
  Quick --> SearchPage["/search"]:::page
  Quick --> ScanPage["/scan"]:::page
  List --> ML["MacroLine"]:::client
  List -.1 serving.-> A1{{"POST /api/log"}}:::api

  classDef page fill:#1f2937,color:#fff,stroke:#111
  classDef server fill:#dcfce7,color:#14532d,stroke:#15803d
  classDef client fill:#dbeafe,color:#1e3a8a,stroke:#2563eb
  classDef data fill:#f3e8ff,color:#581c87,stroke:#9333ea
  classDef api fill:#ffedd5,color:#7c2d12,stroke:#ea580c
  style S1 stroke-dasharray: 5 5
```

## 3. Food search

```mermaid
flowchart TD
  Page["/search ?q= &page=<br/>SearchPage"]:::page
  Page --> Header["PageHeader"]:::server
  Page --> SI["SearchInput<br/>writes ?q= to the URL"]:::client
  subgraph S1 ["Suspense: ResultsSkeleton"]
    Results["SearchResults"]:::server
  end
  Page --> Results
  Results -.-> D1[("food/search<br/>searchFoods")]:::data
  Results --> Item["FoodListItem ×n"]:::server
  Results --> NewLink["NewFoodLink"]:::server
  Item --> Img["FoodImage"]:::client
  Item --> FoodPage["/food/[id]"]:::page
  NewLink --> NewFood["/foods/new"]:::page

  classDef page fill:#1f2937,color:#fff,stroke:#111
  classDef server fill:#dcfce7,color:#14532d,stroke:#15803d
  classDef client fill:#dbeafe,color:#1e3a8a,stroke:#2563eb
  classDef data fill:#f3e8ff,color:#581c87,stroke:#9333ea
  style S1 stroke-dasharray: 5 5
```

## 4. Scan a barcode

```mermaid
flowchart TD
  Page["/scan<br/>ScanPage"]:::page
  Page --> Header["PageHeader"]:::server
  Page --> Scanner["BarcodeScanner"]:::client
  Scanner --> Cam["CameraView<br/>@zxing/browser"]:::client
  Cam --> Frame["ScanFrame"]:::client
  Scanner --> Msg["CameraMessage<br/>no camera / denied"]:::client
  Scanner --> Status["LookupStatus<br/>not found / incomplete"]:::client
  Scanner --> Manual["ManualBarcodeForm"]:::client
  Scanner -.-> A1{{"GET /api/foods/barcode/[code]"}}:::api
  A1 -- found --> FoodPage["/food/[id]"]:::page
  Status -- "יצירת מוצר" --> NewFood["/foods/new ?barcode="]:::page

  classDef page fill:#1f2937,color:#fff,stroke:#111
  classDef server fill:#dcfce7,color:#14532d,stroke:#15803d
  classDef client fill:#dbeafe,color:#1e3a8a,stroke:#2563eb
  classDef api fill:#ffedd5,color:#7c2d12,stroke:#ea580c
```

## 5. Food page

```mermaid
flowchart TD
  Page["/food/[id]<br/>FoodPage"]:::page
  Page --> Back["BackButton"]:::client
  subgraph S1 ["Suspense: FoodSkeleton"]
    Loader["FoodLoader"]:::server
  end
  Page --> Loader
  Loader -.-> D1[("food/search<br/>getVisibleFood")]:::data
  Loader --> Details["FoodDetails<br/>(dumb: gets food)"]:::server
  Details --> Header["Header"]:::server
  Details --> Actions["FoodAmountActions<br/>holds the amount"]:::client
  Details --> Allergens["Allergens"]:::server
  Header --> Img["FoodImage"]:::client
  Header --> Badges["NutriScoreBadge · NovaBadge"]:::server
  Actions --> Calc["FoodAmountCalculator"]:::client
  Actions --> Log["LogButton"]:::client
  Actions --> AddMeal["AddToMealButton"]:::client
  Calc --> Bar["MacroSplitBar"]:::client
  Calc --> Table["NutritionTable"]:::client
  Log --> Toast1["Toast"]:::client
  AddMeal --> Choices["MealChoices"]:::client
  AddMeal --> Toast2["Toast"]:::client
  Log -.-> A1{{"POST /api/log"}}:::api
  AddMeal -.-> A2{{"GET /api/meals<br/>POST /api/meals/[id]/items<br/>POST /api/meals"}}:::api

  classDef page fill:#1f2937,color:#fff,stroke:#111
  classDef server fill:#dcfce7,color:#14532d,stroke:#15803d
  classDef client fill:#dbeafe,color:#1e3a8a,stroke:#2563eb
  classDef data fill:#f3e8ff,color:#581c87,stroke:#9333ea
  classDef api fill:#ffedd5,color:#7c2d12,stroke:#ea580c
  style S1 stroke-dasharray: 5 5
```

## 6. Custom food

```mermaid
flowchart TD
  Page["/foods/new ?name= &barcode=<br/>NewFoodPage"]:::page
  Page --> Back["BackButton"]:::client
  subgraph S1 ["Suspense: MealEditorSkeleton"]
    Loader["NewFoodLoader"]:::server
  end
  Page --> Loader
  Loader -.-> D1[("food/custom-food<br/>prefillFromSearchParams")]:::data
  Loader --> Form["CustomFoodForm"]:::client
  Form --> Field["Field"]:::client
  Form --> Num["NumberInput"]:::client
  Form -.-> A1{{"POST /api/foods"}}:::api
  A1 --> FoodPage["/food/[id]"]:::page

  classDef page fill:#1f2937,color:#fff,stroke:#111
  classDef server fill:#dcfce7,color:#14532d,stroke:#15803d
  classDef client fill:#dbeafe,color:#1e3a8a,stroke:#2563eb
  classDef data fill:#f3e8ff,color:#581c87,stroke:#9333ea
  classDef api fill:#ffedd5,color:#7c2d12,stroke:#ea580c
  style S1 stroke-dasharray: 5 5
```

## 7. Meals

### 7a. My meals and public meals

```mermaid
flowchart TD
  Mine["/meals ?q=<br/>MealsPage"]:::page
  Pub["/meals/public ?q= &page=<br/>PublicMealsPage"]:::page

  Mine --> H1["PageHeader + ארוחה חדשה"]:::server
  Mine --> SI1["SearchInput"]:::client
  subgraph S1 ["Suspense: MealListSkeleton"]
    L1["MyMealsLoader"]:::server
  end
  Mine --> L1
  L1 -.-> D1[("meals/queries<br/>listMyMeals")]:::data
  L1 --> MyList["MyMealsList"]:::server

  Pub --> Back["BackButton"]:::client
  Pub --> SI2["SearchInput"]:::client
  subgraph S2 ["Suspense: MealListSkeleton"]
    L2["PublicMealsLoader"]:::server
  end
  Pub --> L2
  L2 -.-> D2[("meals/queries<br/>listPublicMeals")]:::data
  L2 --> PubList["PublicMealsList"]:::server

  MyList --> Card["MealCard ×n"]:::server
  PubList --> Card
  Card --> Badge["VisibilityBadge"]:::server
  Card --> ML["MacroLine"]:::server
  Card --> MealPage["/meals/[id]"]:::page

  classDef page fill:#1f2937,color:#fff,stroke:#111
  classDef server fill:#dcfce7,color:#14532d,stroke:#15803d
  classDef client fill:#dbeafe,color:#1e3a8a,stroke:#2563eb
  classDef data fill:#f3e8ff,color:#581c87,stroke:#9333ea
  style S1 stroke-dasharray: 5 5
  style S2 stroke-dasharray: 5 5
```

### 7b. One meal: owner edits, others view

```mermaid
flowchart TD
  Page["/meals/[id]<br/>MealPage"]:::page
  NewPage["/meals/new<br/>NewMealPage"]:::page
  Page --> Back["BackButton"]:::client
  subgraph S1 ["Suspense: MealEditorSkeleton"]
    Loader["MealLoader"]:::server
  end
  Page --> Loader
  Loader -.-> D1[("meals/queries<br/>getVisibleMeal")]:::data
  Loader -- "isOwner" --> Editor["MealEditor"]:::client
  Loader -- "someone else's public meal" --> View["MealView"]:::server
  NewPage --> NewLoader["NewMealLoader"]:::server
  NewLoader --> Editor

  View --> VImg["FoodImage · MacroLine"]:::client
  View --> VTot["MealTotals"]:::server
  View --> VLog["LogButton"]:::client
  View --> Copy["CopyMealButton"]:::client
  Copy -.-> A3{{"POST /api/meals/[id]/copy"}}:::api

  Editor --> Vis["VisibilitySwitch<br/>private / public"]:::client
  Editor --> Picker["FoodPicker"]:::client
  Editor --> Item["MealItemRow ×n<br/>amount · move · remove"]:::client
  Editor --> Tot["MealTotals"]:::client
  Editor --> ELog["LogButton<br/>(outside the form)"]:::client
  Picker --> PRes["Results → FoodImage"]:::client
  Item --> IBtn["IconButton · FoodImage · MacroLine"]:::client
  Tot --> TBar["MacroSplitBar · NutritionTable"]:::client
  Picker -.-> A1{{"GET /api/foods?q="}}:::api
  Editor -.save / delete.-> A2{{"POST /api/meals<br/>PATCH, DELETE /api/meals/[id]"}}:::api
  ELog -.-> A4{{"POST /api/log"}}:::api
  VLog -.-> A4

  classDef page fill:#1f2937,color:#fff,stroke:#111
  classDef server fill:#dcfce7,color:#14532d,stroke:#15803d
  classDef client fill:#dbeafe,color:#1e3a8a,stroke:#2563eb
  classDef data fill:#f3e8ff,color:#581c87,stroke:#9333ea
  classDef api fill:#ffedd5,color:#7c2d12,stroke:#ea580c
  style S1 stroke-dasharray: 5 5
```

## 8. Stats

```mermaid
flowchart TD
  Page["/stats<br/>StatsPage"]:::page
  Page --> Header["PageHeader"]:::server
  subgraph S1 ["Suspense: DiarySkeleton"]
    Loader["StatsLoader"]:::server
  end
  Page --> Loader
  Loader -.-> D1[("stats/queries.getWeeklyStats<br/>sums in stats/aggregate")]:::data
  Loader --> View["StatsView"]:::server
  View --> C1["CaloriesChart"]:::client
  View --> C2["MacrosChart"]:::client
  View --> C3["TrendChart"]:::client

  classDef page fill:#1f2937,color:#fff,stroke:#111
  classDef server fill:#dcfce7,color:#14532d,stroke:#15803d
  classDef client fill:#dbeafe,color:#1e3a8a,stroke:#2563eb
  classDef data fill:#f3e8ff,color:#581c87,stroke:#9333ea
  style S1 stroke-dasharray: 5 5
```

## 9. Settings and goals

```mermaid
flowchart TD
  Page["/settings<br/>SettingsPage"]:::page
  Page --> Header["PageHeader"]:::server
  subgraph S1 ["Suspense: MealEditorSkeleton"]
    Loader["SettingsLoader"]:::server
  end
  Page --> Loader
  Loader -.-> D1[("user/settings<br/>getUserSettings")]:::data
  Loader --> Goals["GoalsForm"]:::client
  Loader --> Week["WeekStartSetting"]:::client
  Loader --> Install["InstallApp"]:::client
  Goals --> Calc["GoalCalculator<br/>suggests goals"]:::client
  Goals -.-> A1{{"PUT /api/me/goals"}}:::api
  Week -.-> A2{{"PATCH /api/me"}}:::api

  classDef page fill:#1f2937,color:#fff,stroke:#111
  classDef server fill:#dcfce7,color:#14532d,stroke:#15803d
  classDef client fill:#dbeafe,color:#1e3a8a,stroke:#2563eb
  classDef data fill:#f3e8ff,color:#581c87,stroke:#9333ea
  classDef api fill:#ffedd5,color:#7c2d12,stroke:#ea580c
  style S1 stroke-dasharray: 5 5
```

## Data flow (reads and writes)

```mermaid
flowchart LR
  subgraph Browser
    CC["Client components"]:::client
  end
  subgraph Server
    SC["Server components<br/>(loaders)"]:::server
    API{{"app/api/**/route.ts<br/>session check + Zod"}}:::api
    LIB[("lib/*<br/>queries")]:::data
  end
  DB[("PostgreSQL<br/>Prisma")]:::data
  OFF[("Open Food Facts")]:::data

  SC -.read.-> LIB --> DB
  CC -.fetch.-> API --> DB
  API -.barcode not in DB.-> OFF
  CC -- "router.refresh()" --> SC
  SC --> CC

  classDef server fill:#dcfce7,color:#14532d,stroke:#15803d
  classDef client fill:#dbeafe,color:#1e3a8a,stroke:#2563eb
  classDef data fill:#f3e8ff,color:#581c87,stroke:#9333ea
  classDef api fill:#ffedd5,color:#7c2d12,stroke:#ea580c
```
