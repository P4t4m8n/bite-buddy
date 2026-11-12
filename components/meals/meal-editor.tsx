"use client";

import { LoaderCircle, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { moveItem } from "@/lib/meals/helpers";
import { MEAL_NAME_MAX, MEAL_NOTES_MAX } from "@/lib/meals/schemas";
import {
  displayAmount,
  isSavableAmount,
  MAX_AMOUNT,
  parseAmountInput,
} from "@/lib/nutrition/amount";
import { mealNutrition } from "@/lib/nutrition/nutrients";

import FoodPicker from "@/components/meals/food-picker";
import LogButton from "@/components/diary/log-button";
import MealItemRow, { moveButtonId } from "@/components/meals/meal-item-row";
import MealTotals from "@/components/meals/meal-totals";
import VisibilitySwitch from "@/components/meals/visibility-switch";

import type { Visibility } from "@/generated/prisma/enums";
import type { MealDetail, MealFood } from "@/lib/meals/types";

const DEFAULT_AMOUNT = "100";

type EditorItem = { key: string; food: MealFood; amountInput: string };

type EditorState = { name: string; notes: string; visibility: Visibility; items: EditorItem[] };

type MealEditorProps = {
  /** The owner's saved meal; omitted for a new meal. */
  meal?: MealDetail;
};

let nextItemKey = 0;
const newItemKey = () => `new-${nextItemKey++}`;

const initialState = (meal?: MealDetail): EditorState => ({
  name: meal?.name ?? "",
  notes: meal?.notes ?? "",
  visibility: meal?.visibility ?? "PRIVATE",
  items:
    meal?.items.map((item) => ({
      key: item.id,
      food: item.food,
      amountInput: String(item.amount),
    })) ?? [],
});

/** Compared with the last saved state to know whether there are unsaved changes. */
const snapshot = ({ name, notes, visibility, items }: EditorState) =>
  JSON.stringify([
    name.trim(),
    notes.trim(),
    visibility,
    items.map((item) => [item.food.id, item.amountInput.trim()]),
  ]);

const readMessage = async (response: Response): Promise<string | null> => {
  const body = (await response.json().catch(() => null)) as { message?: string } | null;
  return body?.message ?? null;
};

export default function MealEditor({ meal }: MealEditorProps) {
  const router = useRouter();
  const [state, setState] = useState(() => initialState(meal));
  const [savedSnapshot, setSavedSnapshot] = useState(() => snapshot(initialState(meal)));
  const [busy, setBusy] = useState<"saving" | "deleting" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  const { name, notes, visibility, items } = state;
  const dirty = snapshot(state) !== savedSnapshot;
  const nutrition = mealNutrition(
    items.map((item) => ({ food: item.food, amount: displayAmount(item.amountInput) })),
  );

  // Warn before a reload or closing the tab with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const update = (changes: Partial<EditorState>) => {
    setState((current) => ({ ...current, ...changes }));
    setError(null);
  };

  const setItems = (next: EditorItem[], message: string) => {
    update({ items: next });
    setAnnouncement(message);
  };

  const addFood = (food: MealFood) =>
    setItems(
      [...items, { key: newItemKey(), food, amountInput: DEFAULT_AMOUNT }],
      `${food.name} נוסף לארוחה`,
    );

  const moveFood = (index: number, offset: -1 | 1) => {
    const item = items[index];
    const next = moveItem(items, index, offset);
    if (next === items) return;
    const newIndex = index + offset;
    setItems(next, `${item.food.name} הועבר למקום ${newIndex + 1}`);
    // Keep focus on the moved row; at the top or bottom the button in that direction is disabled.
    const atEdge = offset < 0 ? newIndex === 0 : newIndex === next.length - 1;
    requestAnimationFrame(() =>
      document
        .getElementById(moveButtonId(item.key, atEdge ? (-offset as -1 | 1) : offset))
        ?.focus(),
    );
  };

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("יש להזין שם לארוחה.");
      return;
    }
    const amounts = items.map((item) => parseAmountInput(item.amountInput));
    if (!amounts.every(isSavableAmount)) {
      setError(`יש להזין לכל מוצר כמות גדולה מ־0 ועד ${MAX_AMOUNT}.`);
      return;
    }

    setBusy("saving");
    setError(null);
    try {
      const response = await fetch(meal ? `/api/meals/${meal.id}` : "/api/meals", {
        method: meal ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          notes: notes.trim() || null,
          visibility,
          items: items.map((item, index) => ({ foodId: item.food.id, amount: amounts[index] })),
        }),
      });
      if (!response.ok) {
        setError((await readMessage(response)) ?? "השמירה נכשלה. נסו שוב.");
        return;
      }
      setSavedSnapshot(snapshot(state));
      if (meal) {
        setJustSaved(true);
        router.refresh();
      } else {
        const { id } = (await response.json()) as { id: string };
        router.push(`/meals/${id}`);
      }
    } catch {
      setError("השמירה נכשלה. בדקו את החיבור ונסו שוב.");
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    if (!meal || !window.confirm(`למחוק את הארוחה ״${meal.name}״?`)) return;
    setBusy("deleting");
    setError(null);
    try {
      const response = await fetch(`/api/meals/${meal.id}`, { method: "DELETE" });
      if (!response.ok) {
        setError((await readMessage(response)) ?? "המחיקה נכשלה. נסו שוב.");
        setBusy(null);
        return;
      }
      setSavedSnapshot(snapshot(state));
      router.push("/meals");
      router.refresh();
    } catch {
      setError("המחיקה נכשלה. בדקו את החיבור ונסו שוב.");
      setBusy(null);
    }
  };

  return (
    <>
      <form onSubmit={save} noValidate className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          {meal ? "עריכת ארוחה" : "ארוחה חדשה"}
        </h1>

        <div className="space-y-4">
          <div>
            <label htmlFor="meal-name" className="text-sm font-medium">
              שם הארוחה
            </label>
            <input
              id="meal-name"
              type="text"
              value={name}
              maxLength={MEAL_NAME_MAX}
              onChange={(event) => update({ name: event.target.value })}
              placeholder="לדוגמה: דייסת שיבולת שועל"
              autoComplete="off"
              required
              className="mt-1 h-11 w-full rounded-lg border border-foreground/15 bg-background px-3 focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none"
            />
          </div>
          <div>
            <label htmlFor="meal-notes" className="text-sm font-medium">
              הערות <span className="font-normal text-foreground/60">(לא חובה)</span>
            </label>
            <textarea
              id="meal-notes"
              value={notes}
              maxLength={MEAL_NOTES_MAX}
              onChange={(event) => update({ notes: event.target.value })}
              rows={2}
              className="mt-1 w-full rounded-lg border border-foreground/15 bg-background px-3 py-2 focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none"
            />
          </div>
          <VisibilitySwitch
            isPublic={visibility === "PUBLIC"}
            onChange={(isPublic) => update({ visibility: isPublic ? "PUBLIC" : "PRIVATE" })}
          />
        </div>

        <section aria-labelledby="meal-items-heading" className="space-y-3">
          <h2 id="meal-items-heading" className="font-semibold">
            מוצרים בארוחה
          </h2>
          {items.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-foreground/15 p-4 text-center text-sm text-foreground/60">
              עוד לא נוספו מוצרים. חפשו מוצר כדי להוסיף אותו.
            </p>
          ) : (
            <ol className="space-y-2">
              {items.map((item, index) => (
                <MealItemRow
                  key={item.key}
                  itemKey={item.key}
                  food={item.food}
                  amountInput={item.amountInput}
                  invalid={!isSavableAmount(parseAmountInput(item.amountInput))}
                  nutrients={nutrition.items[index]}
                  isFirst={index === 0}
                  isLast={index === items.length - 1}
                  onAmountChange={(value) =>
                    update({
                      items: items.map((it) =>
                        it.key === item.key ? { ...it, amountInput: value } : it,
                      ),
                    })
                  }
                  onMove={(offset) => moveFood(index, offset)}
                  onRemove={() =>
                    setItems(
                      items.filter((it) => it.key !== item.key),
                      `${item.food.name} הוסר מהארוחה`,
                    )
                  }
                />
              ))}
            </ol>
          )}
          <p role="status" className="sr-only">
            {announcement}
          </p>
        </section>

        <FoodPicker onAdd={addFood} showScanLink={Boolean(meal) && !dirty} />

        <MealTotals totals={nutrition.totals} totalAmount={nutrition.totalAmount} />

        <div className="space-y-3">
          {error ? (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          ) : null}
          <p role="status" className="text-sm text-foreground/60">
            {justSaved && !dirty ? "הארוחה נשמרה." : dirty && meal ? "יש שינויים שלא נשמרו." : ""}
          </p>
          <button
            type="submit"
            disabled={busy !== null}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand font-medium text-white disabled:opacity-50"
          >
            {busy === "saving" ? (
              <LoaderCircle aria-hidden className="size-4 animate-spin" />
            ) : (
              <Save aria-hidden className="size-4" />
            )}
            {meal ? "שמירת השינויים" : "שמירת הארוחה"}
          </button>
          {meal ? (
            <button
              type="button"
              onClick={remove}
              disabled={busy !== null}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-full font-medium text-red-600 hover:bg-red-500/10 disabled:opacity-50"
            >
              <Trash2 aria-hidden className="size-4" />
              מחיקת הארוחה
            </button>
          ) : null}
        </div>
      </form>
      {/* Outside the form: the dialog has its own form, and logging uses the saved meal. */}
      {meal && !dirty ? (
        <div className="mt-3">
          <LogButton
            target={{ kind: "meal", mealId: meal.id, name: meal.name }}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-foreground/15 font-medium disabled:opacity-50"
          />
        </div>
      ) : null}
    </>
  );
}
