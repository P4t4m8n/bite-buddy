"use client";

import { Keyboard } from "lucide-react";
import { useState } from "react";

import { barcodeSchema } from "@/lib/food/barcode";

type ManualBarcodeFormProps = {
  disabled?: boolean;
  onSubmit: (code: string) => void;
};

export default function ManualBarcodeForm({ disabled, onSubmit }: ManualBarcodeFormProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = barcodeSchema.safeParse(value);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? null);
      return;
    }
    setError(null);
    onSubmit(result.data);
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-2">
      <label htmlFor="manual-barcode" className="flex items-center gap-2 text-sm font-medium">
        <Keyboard aria-hidden className="size-4 text-foreground/60" />
        הקלדת ברקוד
      </label>
      <div className="flex gap-2">
        <input
          id="manual-barcode"
          name="barcode"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          enterKeyHint="search"
          dir="ltr"
          maxLength={14}
          placeholder="7290000000000"
          value={value}
          onChange={(event) => {
            setValue(event.target.value.replace(/\D/g, ""));
            setError(null);
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "manual-barcode-error" : undefined}
          className="h-12 min-w-0 flex-1 rounded-xl border border-foreground/15 bg-background px-3 text-start tracking-wider tabular-nums focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none aria-invalid:border-red-500"
        />
        <button
          type="submit"
          disabled={disabled}
          className="h-12 shrink-0 rounded-xl bg-brand px-5 font-medium text-brand-foreground disabled:opacity-50"
        >
          חיפוש
        </button>
      </div>
      {error ? (
        <p
          id="manual-barcode-error"
          role="alert"
          className="text-sm text-red-600 dark:text-red-400"
        >
          {error}
        </p>
      ) : null}
    </form>
  );
}
