"use client";

import { LoaderCircle, Plus, UtensilsCrossed, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";

import { itemCountLabel } from "@/lib/meals/helpers";
import { MEAL_NAME_MAX } from "@/lib/meals/schemas";
import { isSavableAmount } from "@/lib/nutrition/amount";
import { UNIT_LABELS } from "@/lib/nutrition/format";

import Toast from "@/components/toast";

import type { FoodUnit } from "@/generated/prisma/enums";
import type { MealOption } from "@/lib/meals/types";
import type { ToastMessage } from "@/components/toast";

type AddToMealButtonProps = {
  foodId: string;
  foodName: string;
  /** In the food's unit, from the amount calculator. */
  amount: number;
  unit: FoodUnit;
};

type MealsState =
  { status: "loading" } | { status: "error" } | { status: "ready"; meals: MealOption[] };

const postJson = (url: string, body: unknown) =>
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

const errorMessage = async (response: Response) => {
  const body = (await response.json().catch(() => null)) as { message?: string } | null;
  return body?.message ?? "ההוספה נכשלה. נסו שוב.";
};

/** "Add to meal" on the food page: a dialog listing the user's meals, plus "new meal". */
export default function AddToMealButton({ foodId, foodName, amount, unit }: AddToMealButtonProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [meals, setMeals] = useState<MealsState>({ status: "loading" });
  const [newName, setNewName] = useState(foodName.slice(0, MEAL_NAME_MAX));
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const dismissToast = useCallback(() => setToast(null), []);

  const amountLabel = `${amount} ${UNIT_LABELS[unit]}`;
  const canAdd = isSavableAmount(amount);

  const loadMeals = async () => {
    setMeals({ status: "loading" });
    try {
      const response = await fetch("/api/meals");
      if (!response.ok) throw new Error(`Loading meals failed: ${response.status}`);
      const { items } = (await response.json()) as { items: MealOption[] };
      setMeals({ status: "ready", meals: items });
    } catch {
      setMeals({ status: "error" });
    }
  };

  const open = () => {
    setError(null);
    dialogRef.current?.showModal();
    void loadMeals();
  };

  const close = () => dialogRef.current?.close();

  const done = (mealId: string, text: string) => {
    close();
    setToast({ id: Date.now(), text, href: `/meals/${mealId}`, linkLabel: "לארוחה" });
  };

  const addTo = async (meal: MealOption) => {
    setPending(meal.id);
    setError(null);
    try {
      const response = await postJson(`/api/meals/${meal.id}/items`, { foodId, amount });
      if (!response.ok) return setError(await errorMessage(response));
      done(meal.id, `${foodName} (${amountLabel}) נוסף לארוחה ״${meal.name}״.`);
    } catch {
      setError("ההוספה נכשלה. בדקו את החיבור ונסו שוב.");
    } finally {
      setPending(null);
    }
  };

  const createWith = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = newName.trim();
    if (!name) return setError("יש להזין שם לארוחה.");
    setPending("new");
    setError(null);
    try {
      const response = await postJson("/api/meals", { name, items: [{ foodId, amount }] });
      if (!response.ok) return setError(await errorMessage(response));
      const { id } = (await response.json()) as { id: string };
      done(id, `נוצרה ארוחה חדשה ״${name}״ עם ${foodName}.`);
    } catch {
      setError("יצירת הארוחה נכשלה. בדקו את החיבור ונסו שוב.");
    } finally {
      setPending(null);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={open}
        disabled={!canAdd}
        title={canAdd ? undefined : "יש לבחור כמות"}
        className="flex h-11 items-center justify-center gap-2 rounded-full border border-foreground/15 font-medium disabled:opacity-50"
      >
        <UtensilsCrossed aria-hidden className="size-4" />
        הוספה לארוחה
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby="add-to-meal-title"
        className="m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-md rounded-2xl bg-background p-0 text-foreground shadow-xl backdrop:bg-black/40"
      >
        <div className="space-y-4 p-4">
          <header className="flex items-start justify-between gap-2">
            <div>
              <h2 id="add-to-meal-title" className="text-lg font-semibold">
                הוספה לארוחה
              </h2>
              <p className="text-sm text-foreground/60">
                {foodName} · {amountLabel}
              </p>
            </div>
            <button
              type="button"
              onClick={close}
              aria-label="סגירה"
              className="rounded-lg p-1 text-foreground/60 hover:bg-foreground/5"
            >
              <X className="size-5" />
            </button>
          </header>

          <MealChoices meals={meals} pending={pending} onAdd={addTo} onRetry={loadMeals} />

          <form onSubmit={createWith} className="space-y-2 border-t border-foreground/10 pt-4">
            <label htmlFor="new-meal-name" className="text-sm font-medium">
              ארוחה חדשה
            </label>
            <div className="flex gap-2">
              <input
                id="new-meal-name"
                type="text"
                value={newName}
                maxLength={MEAL_NAME_MAX}
                onChange={(event) => setNewName(event.target.value)}
                autoComplete="off"
                className="h-11 min-w-0 flex-1 rounded-lg border border-foreground/15 bg-background px-3 focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none"
              />
              <button
                type="submit"
                disabled={pending !== null}
                className="flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-brand px-4 text-sm font-medium text-white disabled:opacity-50"
              >
                {pending === "new" ? (
                  <LoaderCircle aria-hidden className="size-4 animate-spin" />
                ) : (
                  <Plus aria-hidden className="size-4" />
                )}
                יצירה והוספה
              </button>
            </div>
          </form>

          {error ? (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          ) : null}
        </div>
      </dialog>

      <Toast toast={toast} onDismiss={dismissToast} />
    </>
  );
}

type MealChoicesProps = {
  meals: MealsState;
  pending: string | null;
  onAdd: (meal: MealOption) => void;
  onRetry: () => void;
};

const MealChoices = ({ meals, pending, onAdd, onRetry }: MealChoicesProps) => {
  if (meals.status === "loading") {
    return (
      <p className="flex items-center gap-2 text-sm text-foreground/60">
        <LoaderCircle aria-hidden className="size-4 animate-spin" />
        טוען ארוחות…
      </p>
    );
  }
  if (meals.status === "error") {
    return (
      <p role="alert" className="text-sm text-red-600">
        לא הצלחנו לטעון את הארוחות.{" "}
        <button type="button" onClick={onRetry} className="font-medium underline">
          נסו שוב
        </button>
      </p>
    );
  }
  if (meals.meals.length === 0) {
    return <p className="text-sm text-foreground/60">עוד אין לכם ארוחות. אפשר ליצור אחת כאן.</p>;
  }
  return (
    <ul aria-label="הארוחות שלי" className="max-h-64 space-y-1 overflow-y-auto">
      {meals.meals.map((meal) => (
        <li key={meal.id} className="flex items-center gap-3 rounded-xl p-2 hover:bg-foreground/5">
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{meal.name}</p>
            <p className="text-xs text-foreground/60">{itemCountLabel(meal.itemCount)}</p>
          </div>
          <button
            type="button"
            onClick={() => onAdd(meal)}
            disabled={pending !== null}
            aria-label={`הוספה ל־${meal.name}`}
            className="flex h-9 shrink-0 items-center gap-1 rounded-full border border-foreground/15 px-3 text-sm font-medium disabled:opacity-50"
          >
            {pending === meal.id ? (
              <LoaderCircle aria-hidden className="size-4 animate-spin" />
            ) : (
              <Plus aria-hidden className="size-4" />
            )}
            הוספה
          </button>
        </li>
      ))}
    </ul>
  );
};
