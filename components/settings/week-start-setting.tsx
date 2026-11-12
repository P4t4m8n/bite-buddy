"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { WeekStart } from "@/generated/prisma/enums";

const OPTIONS: { value: WeekStart; label: string }[] = [
  { value: "SUNDAY", label: "יום ראשון" },
  { value: "MONDAY", label: "יום שני" },
];

export default function WeekStartSetting({ value }: { value: WeekStart }) {
  const router = useRouter();
  const [selected, setSelected] = useState(value);
  const [error, setError] = useState<string | null>(null);

  const change = async (next: WeekStart) => {
    const previous = selected;
    setSelected(next);
    setError(null);
    const response = await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weekStartsOn: next }),
    }).catch(() => null);
    if (response?.ok) {
      router.refresh();
    } else {
      setSelected(previous);
      setError("השמירה נכשלה. נסו שוב.");
    }
  };

  return (
    <fieldset className="space-y-2">
      <legend className="text-lg font-semibold">השבוע מתחיל ב…</legend>
      <div className="grid grid-cols-2 gap-2">
        {OPTIONS.map((option) => (
          <label
            key={option.value}
            className="flex h-11 cursor-pointer items-center justify-center rounded-lg border border-foreground/15 text-sm has-checked:border-brand has-checked:bg-brand/10 has-checked:text-brand"
          >
            <input
              type="radio"
              name="weekStartsOn"
              value={option.value}
              checked={selected === option.value}
              onChange={() => void change(option.value)}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </div>
      {error ? (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
