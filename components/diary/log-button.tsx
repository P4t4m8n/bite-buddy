"use client";

import { ClipboardPlus, LoaderCircle, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";

import { dateKeyInZone, hourInZone, mealTypeForHour } from "@/lib/diary/dates";
import { MAX_SERVINGS, MEAL_TYPE_LABELS, MEAL_TYPES } from "@/lib/diary/schemas";
import { isSavableAmount, parseAmountInput } from "@/lib/nutrition/amount";
import { UNIT_LABELS } from "@/lib/nutrition/format";

import Toast from "@/components/toast";

import type { FoodUnit, MealType } from "@/generated/prisma/enums";
import type { ToastMessage } from "@/components/toast";

export type LogTarget =
  | { kind: "food"; foodId: string; name: string; amount: number; unit: FoodUnit }
  | { kind: "meal"; mealId: string; name: string };

type LogButtonProps = { target: LogTarget; className?: string };

const browserTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

/** "הוספה ליומן" with a small dialog to pick the day, the meal and (for meals) the servings. */
export default function LogButton({ target, className }: LogButtonProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [date, setDate] = useState("");
  const [mealType, setMealType] = useState<MealType>("BREAKFAST");
  const [servings, setServings] = useState("1");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const dismissToast = useCallback(() => setToast(null), []);

  const canLog = target.kind === "meal" || isSavableAmount(target.amount);

  const open = () => {
    const now = new Date();
    const timeZone = browserTimeZone();
    setDate(dateKeyInZone(now, timeZone));
    setMealType(mealTypeForHour(hourInZone(now, timeZone)));
    setError(null);
    dialogRef.current?.showModal();
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const servingCount = parseAmountInput(servings);
    if (
      target.kind === "meal" &&
      (servingCount === null || servingCount <= 0 || servingCount > MAX_SERVINGS)
    ) {
      setError(`יש להזין מספר מנות בין 0 ל־${MAX_SERVINGS}.`);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          mealType,
          timezone: browserTimeZone(),
          ...(target.kind === "food"
            ? { foodId: target.foodId, amount: target.amount }
            : { mealId: target.mealId, servings: servingCount }),
        }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null;
        setError(body?.message ?? "הרישום נכשל. נסו שוב.");
        return;
      }
      dialogRef.current?.close();
      const isToday = date === dateKeyInZone(new Date(), browserTimeZone());
      setToast({
        id: Date.now(),
        text: `${target.name} נוסף ל${MEAL_TYPE_LABELS[mealType]}`,
        href: isToday ? "/" : `/?date=${date}`,
        linkLabel: "ליומן",
      });
    } catch {
      setError("הרישום נכשל. בדקו את החיבור ונסו שוב.");
    } finally {
      setSaving(false);
    }
  };

  const summary =
    target.kind === "food"
      ? `${target.name} · ${target.amount} ${UNIT_LABELS[target.unit]}`
      : target.name;

  return (
    <>
      <button
        type="button"
        onClick={open}
        disabled={!canLog}
        title={canLog ? undefined : "יש לבחור כמות"}
        className={
          className ??
          "flex h-11 w-full items-center justify-center gap-2 rounded-full bg-brand font-medium text-white disabled:opacity-50"
        }
      >
        <ClipboardPlus aria-hidden className="size-4" />
        הוספה ליומן
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby="log-dialog-title"
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl bg-background p-0 text-foreground shadow-xl backdrop:bg-black/40"
      >
        <form onSubmit={submit} className="space-y-4 p-4">
          <header className="flex items-start justify-between gap-2">
            <div>
              <h2 id="log-dialog-title" className="text-lg font-semibold">
                הוספה ליומן
              </h2>
              <p className="text-sm text-foreground/60">{summary}</p>
            </div>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              aria-label="סגירה"
              className="rounded-lg p-1 text-foreground/60 hover:bg-foreground/5"
            >
              <X className="size-5" />
            </button>
          </header>

          <div>
            <label htmlFor="log-date" className="text-sm font-medium">
              תאריך
            </label>
            <input
              id="log-date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
              className="mt-1 h-11 w-full rounded-lg border border-foreground/15 bg-background px-3 focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none"
            />
          </div>

          <fieldset>
            <legend className="text-sm font-medium">ארוחה</legend>
            <div className="mt-1 grid grid-cols-2 gap-2">
              {MEAL_TYPES.map((type) => (
                <label
                  key={type}
                  className="flex h-10 cursor-pointer items-center justify-center rounded-lg border border-foreground/15 text-sm has-checked:border-brand has-checked:bg-brand/10 has-checked:text-brand"
                >
                  <input
                    type="radio"
                    name="mealType"
                    value={type}
                    checked={mealType === type}
                    onChange={() => setMealType(type)}
                    className="sr-only"
                  />
                  {MEAL_TYPE_LABELS[type]}
                </label>
              ))}
            </div>
          </fieldset>

          {target.kind === "meal" ? (
            <div className="flex items-center gap-3">
              <label htmlFor="log-servings" className="flex-1 text-sm font-medium">
                מספר מנות
              </label>
              <input
                id="log-servings"
                type="number"
                inputMode="decimal"
                step="any"
                min={0}
                max={MAX_SERVINGS}
                value={servings}
                onChange={(event) => setServings(event.target.value)}
                className="h-10 w-24 rounded-lg border border-foreground/15 bg-background px-2 text-end tabular-nums focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none"
              />
            </div>
          ) : null}

          {error ? (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={saving}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-brand font-medium text-white disabled:opacity-50"
          >
            {saving ? <LoaderCircle aria-hidden className="size-4 animate-spin" /> : null}
            רישום ביומן
          </button>
        </form>
      </dialog>

      <Toast toast={toast} onDismiss={dismissToast} />
    </>
  );
}
