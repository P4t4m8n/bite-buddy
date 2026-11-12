"use client";

import { Check, LoaderCircle, Pencil, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { MAX_SERVINGS } from "@/lib/diary/schemas";
import { MAX_AMOUNT, parseAmountInput } from "@/lib/nutrition/amount";
import { UNIT_LABELS } from "@/lib/nutrition/format";

import MacroLine from "@/components/meals/macro-line";

import type { DiaryEntry } from "@/lib/diary/types";

const quantityLabel = (entry: DiaryEntry) => {
  if (entry.servings !== null) return entry.servings === 1 ? "מנה אחת" : `${entry.servings} מנות`;
  if (entry.amount !== null) return `${entry.amount} ${UNIT_LABELS[entry.unit]}`;
  return null;
};

const entryHref = (entry: DiaryEntry) => {
  if (entry.foodId) return `/food/${entry.foodId}`;
  if (entry.mealId) return `/meals/${entry.mealId}`;
  return null;
};

export default function LogEntryRow({ entry }: { entry: DiaryEntry }) {
  const router = useRouter();
  const isMeal = entry.servings !== null;
  const current = isMeal ? entry.servings : entry.amount;
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState(String(current ?? ""));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const href = entryHref(entry);
  const quantity = quantityLabel(entry);
  const max = isMeal ? MAX_SERVINGS : MAX_AMOUNT;

  const send = async (init: RequestInit) => {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/log/${entry.id}`, init);
      if (!response.ok) throw new Error(String(response.status));
      setEditing(false);
      router.refresh();
    } catch {
      setError("הפעולה נכשלה. נסו שוב.");
    } finally {
      setBusy(false);
    }
  };

  const save = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = parseAmountInput(input);
    if (value === null || value <= 0 || value > max) {
      setError(`יש להזין מספר בין 0 ל־${max}.`);
      return;
    }
    void send({
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isMeal ? { servings: value } : { amount: value }),
    });
  };

  const remove = () => {
    if (!window.confirm(`למחוק את ״${entry.name}״ מהיומן?`)) return;
    void send({ method: "DELETE" });
  };

  return (
    <li className="rounded-2xl border border-foreground/10 p-3">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          {href ? (
            <Link href={href} className="block truncate font-medium hover:underline">
              {entry.name}
            </Link>
          ) : (
            <p className="truncate font-medium">{entry.name}</p>
          )}
          {quantity ? <p className="text-sm text-foreground/60">{quantity}</p> : null}
          <MacroLine nutrients={entry.nutrients} className="mt-0.5" />
        </div>
        {current !== null ? (
          <button
            type="button"
            onClick={() => {
              setInput(String(current));
              setEditing((value) => !value);
              setError(null);
            }}
            aria-label={`עריכת כמות: ${entry.name}`}
            className="flex size-9 items-center justify-center rounded-lg text-foreground/60 hover:bg-foreground/5 hover:text-foreground"
          >
            <Pencil className="size-4" />
          </button>
        ) : null}
        <button
          type="button"
          onClick={remove}
          disabled={busy}
          aria-label={`מחיקה: ${entry.name}`}
          className="flex size-9 items-center justify-center rounded-lg text-foreground/60 hover:bg-foreground/5 hover:text-red-600 disabled:opacity-40"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      {editing ? (
        <form onSubmit={save} className="mt-2 flex items-center gap-2">
          <label htmlFor={`entry-${entry.id}`} className="text-sm text-foreground/60">
            {isMeal ? "מנות" : "כמות"}
            <span className="sr-only">: {entry.name}</span>
          </label>
          <input
            id={`entry-${entry.id}`}
            type="number"
            inputMode="decimal"
            step="any"
            min={0}
            max={max}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            autoFocus
            className="h-9 w-24 rounded-lg border border-foreground/15 bg-background px-2 text-end tabular-nums focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none"
          />
          {isMeal ? null : (
            <span className="text-sm text-foreground/60">{UNIT_LABELS[entry.unit]}</span>
          )}
          <button
            type="submit"
            disabled={busy}
            aria-label="שמירה"
            className="flex size-9 items-center justify-center rounded-lg bg-brand text-white disabled:opacity-50"
          >
            {busy ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" />}
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            aria-label="ביטול"
            className="flex size-9 items-center justify-center rounded-lg text-foreground/60 hover:bg-foreground/5"
          >
            <X className="size-4" />
          </button>
        </form>
      ) : null}

      {error ? (
        <p role="alert" className="mt-1 text-sm text-red-600">
          {error}
        </p>
      ) : null}
    </li>
  );
}
