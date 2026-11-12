-- Fuzzy food-name search (Food_name_trgm_idx). Added by hand: Prisma doesn't manage extensions.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- CreateEnum
CREATE TYPE "WeekStart" AS ENUM ('SUNDAY', 'MONDAY');

-- CreateEnum
CREATE TYPE "FoodUnit" AS ENUM ('G', 'ML');

-- CreateEnum
CREATE TYPE "FoodSource" AS ENUM ('SEED', 'OFF', 'USER');

-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('PRIVATE', 'PUBLIC');

-- CreateEnum
CREATE TYPE "MealType" AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "weekStartsOn" "WeekStart" NOT NULL DEFAULT 'SUNDAY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserGoals" (
    "userId" TEXT NOT NULL,
    "kcal" INTEGER NOT NULL,
    "proteinG" INTEGER NOT NULL,
    "carbsG" INTEGER NOT NULL,
    "fatG" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserGoals_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Food" (
    "id" TEXT NOT NULL,
    "barcode" TEXT,
    "name" TEXT NOT NULL,
    "brands" TEXT[],
    "categories" TEXT[],
    "imageUrl" TEXT,
    "unit" "FoodUnit" NOT NULL DEFAULT 'G',
    "packageAmount" DOUBLE PRECISION,
    "kcal100" DOUBLE PRECISION,
    "protein100" DOUBLE PRECISION,
    "carbs100" DOUBLE PRECISION,
    "fat100" DOUBLE PRECISION,
    "sugar100" DOUBLE PRECISION,
    "fiber100" DOUBLE PRECISION,
    "satFat100" DOUBLE PRECISION,
    "salt100" DOUBLE PRECISION,
    "sodium100" DOUBLE PRECISION,
    "hasNutrition" BOOLEAN NOT NULL DEFAULT false,
    "nutritionGrade" TEXT,
    "novaGroup" INTEGER,
    "allergens" TEXT[],
    "source" "FoodSource" NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Food_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "notes" TEXT,
    "visibility" "Visibility" NOT NULL DEFAULT 'PRIVATE',
    "copiedFromId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Meal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MealItem" (
    "id" TEXT NOT NULL,
    "mealId" TEXT NOT NULL,
    "foodId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MealItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eatenAt" TIMESTAMPTZ(3) NOT NULL,
    "mealType" "MealType" NOT NULL,
    "foodId" TEXT,
    "mealId" TEXT,
    "amount" DOUBLE PRECISION,
    "servings" DOUBLE PRECISION,
    "name" TEXT NOT NULL,
    "kcal" DOUBLE PRECISION,
    "protein" DOUBLE PRECISION,
    "carbs" DOUBLE PRECISION,
    "fat" DOUBLE PRECISION,
    "fiber" DOUBLE PRECISION,
    "sugar" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LogEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Food_barcode_key" ON "Food"("barcode");

-- CreateIndex
CREATE INDEX "Food_name_trgm_idx" ON "Food" USING GIN ("name" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "Food_createdById_idx" ON "Food"("createdById");

-- CreateIndex
CREATE INDEX "Meal_userId_idx" ON "Meal"("userId");

-- CreateIndex
CREATE INDEX "Meal_visibility_idx" ON "Meal"("visibility");

-- CreateIndex
CREATE INDEX "MealItem_mealId_idx" ON "MealItem"("mealId");

-- CreateIndex
CREATE INDEX "MealItem_foodId_idx" ON "MealItem"("foodId");

-- CreateIndex
CREATE INDEX "LogEntry_userId_eatenAt_idx" ON "LogEntry"("userId", "eatenAt");

-- CreateIndex
CREATE INDEX "LogEntry_foodId_idx" ON "LogEntry"("foodId");

-- CreateIndex
CREATE INDEX "LogEntry_mealId_idx" ON "LogEntry"("mealId");

-- AddForeignKey
ALTER TABLE "UserGoals" ADD CONSTRAINT "UserGoals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Food" ADD CONSTRAINT "Food_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meal" ADD CONSTRAINT "Meal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meal" ADD CONSTRAINT "Meal_copiedFromId_fkey" FOREIGN KEY ("copiedFromId") REFERENCES "Meal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealItem" ADD CONSTRAINT "MealItem_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealItem" ADD CONSTRAINT "MealItem_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogEntry" ADD CONSTRAINT "LogEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogEntry" ADD CONSTRAINT "LogEntry_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogEntry" ADD CONSTRAINT "LogEntry_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
