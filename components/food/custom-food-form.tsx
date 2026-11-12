"use client";

import { LoaderCircle, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { FOOD_NAME_MAX, formValuesToBody } from "@/lib/food/custom-food";
import { UNIT_LABELS } from "@/lib/nutrition/format";

import type { CustomFoodFormValues, FormNumberField } from "@/lib/food/custom-food";

type CustomFoodFormProps = { initialValues: CustomFoodFormValues };

type NumberFieldConfig = {
  field: FormNumberField;
  label: string;
  unit: "kcal" | "g" | "mg";
  required?: boolean;
  sub?: boolean;
};

const NUTRIENT_FIELDS: NumberFieldConfig[] = [
  { field: "kcal100", label: "קלוריות", unit: "kcal", required: true },
  { field: "protein100", label: "חלבונים", unit: "g", required: true },
  { field: "carbs100", label: "פחמימות", unit: "g", required: true },
  { field: "sugar100", label: "מתוכן סוכרים", unit: "g", sub: true },
  { field: "fat100", label: "שומנים", unit: "g", required: true },
  { field: "satFat100", label: "מתוכם שומן רווי", unit: "g", sub: true },
  { field: "fiber100", label: "סיבים תזונתיים", unit: "g" },
  { field: "sodiumMg100", label: "נתרן", unit: "mg" },
];

const UNIT_TEXT = { kcal: "קק״ל", g: "ג׳", mg: "מ״ג" } as const;

const inputClass =
  "h-11 w-full rounded-lg border border-foreground/15 bg-background px-3 focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none";

export default function CustomFoodForm({ initialValues }: CustomFoodFormProps) {
  const router = useRouter();
  const [values, setValues] = useState(initialValues);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingId, setExistingId] = useState<string | null>(null);

  const set = (changes: Partial<CustomFoodFormValues>) => {
    setValues((current) => ({ ...current, ...changes }));
    setError(null);
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setExistingId(null);
    try {
      const response = await fetch("/api/foods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formValuesToBody(values)),
      });
      const body = (await response.json().catch(() => null)) as {
        id?: string;
        message?: string;
        existingId?: string;
      } | null;
      if (response.ok && body?.id) {
        router.push(`/food/${body.id}`);
        return;
      }
      setError(body?.message ?? "השמירה נכשלה. נסו שוב.");
      setExistingId(body?.existingId ?? null);
    } catch {
      setError("השמירה נכשלה. בדקו את החיבור ונסו שוב.");
    }
    setSaving(false);
  };

  const unitLabel = UNIT_LABELS[values.unit];

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">מוצר חדש</h1>
      <p className="-mt-4 text-sm text-foreground/60">
        המוצר יופיע בחיפוש רק אצלכם. הערכים הם לכל 100 {unitLabel}.
      </p>

      <div className="space-y-4">
        <Field id="food-name" label="שם המוצר">
          <input
            id="food-name"
            type="text"
            value={values.name}
            maxLength={FOOD_NAME_MAX}
            onChange={(event) => set({ name: event.target.value })}
            autoComplete="off"
            required
            className={inputClass}
          />
        </Field>
        <Field id="food-brands" label="מותג" optional>
          <input
            id="food-brands"
            type="text"
            value={values.brands}
            onChange={(event) => set({ brands: event.target.value })}
            autoComplete="off"
            className={inputClass}
          />
        </Field>
        <Field id="food-barcode" label="ברקוד" optional>
          <input
            id="food-barcode"
            type="text"
            inputMode="numeric"
            dir="ltr"
            value={values.barcode}
            onChange={(event) => set({ barcode: event.target.value.replace(/\D/g, "") })}
            maxLength={14}
            autoComplete="off"
            className={`${inputClass} text-end`}
          />
        </Field>

        <fieldset>
          <legend className="text-sm font-medium">יחידה</legend>
          <div className="mt-1 grid grid-cols-2 gap-2">
            {(["G", "ML"] as const).map((unit) => (
              <label
                key={unit}
                className="flex h-11 cursor-pointer items-center justify-center rounded-lg border border-foreground/15 text-sm has-checked:border-brand has-checked:bg-brand/5 has-checked:text-brand"
              >
                <input
                  type="radio"
                  name="unit"
                  value={unit}
                  checked={values.unit === unit}
                  onChange={() => set({ unit })}
                  className="sr-only"
                />
                {unit === "G" ? "גרם (מוצק)" : "מ״ל (משקה)"}
              </label>
            ))}
          </div>
        </fieldset>

        <NumberInput
          config={{ field: "packageAmount", label: "גודל אריזה", unit: "g" }}
          unitText={unitLabel}
          values={values}
          onChange={set}
        />
      </div>

      <section aria-labelledby="nutrients-heading" className="space-y-3">
        <h2 id="nutrients-heading" className="font-semibold">
          ערכים תזונתיים ל־100 {unitLabel}
        </h2>
        {NUTRIENT_FIELDS.map((config) => (
          <NumberInput
            key={config.field}
            config={config}
            unitText={UNIT_TEXT[config.unit]}
            values={values}
            onChange={set}
          />
        ))}
      </section>

      <div className="space-y-3">
        {error ? (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {error}{" "}
            {existingId ? (
              <Link href={`/food/${existingId}`} className="font-medium underline">
                למוצר הקיים
              </Link>
            ) : null}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={saving}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand font-medium text-brand-foreground disabled:opacity-50"
        >
          {saving ? (
            <LoaderCircle aria-hidden className="size-4 animate-spin" />
          ) : (
            <Save aria-hidden className="size-4" />
          )}
          שמירת המוצר
        </button>
      </div>
    </form>
  );
}

type FieldProps = { id: string; label: string; optional?: boolean; children: React.ReactNode };

const Field = ({ id, label, optional, children }: FieldProps) => (
  <div>
    <label htmlFor={id} className="text-sm font-medium">
      {label}
      {optional ? <span className="font-normal text-foreground/60"> (לא חובה)</span> : null}
    </label>
    <div className="mt-1">{children}</div>
  </div>
);

type NumberInputProps = {
  config: NumberFieldConfig;
  unitText: string;
  values: CustomFoodFormValues;
  onChange: (changes: Partial<CustomFoodFormValues>) => void;
};

const NumberInput = ({ config, unitText, values, onChange }: NumberInputProps) => {
  const id = `food-${config.field}`;
  return (
    <div className="flex items-center gap-3">
      <label
        htmlFor={id}
        className={`flex-1 text-sm ${config.sub ? "ps-4 text-foreground/60" : "font-medium"}`}
      >
        {config.label}
        {config.required ? null : (
          <span className="font-normal text-foreground/60"> (לא חובה)</span>
        )}
      </label>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        value={values[config.field]}
        onChange={(event) => onChange({ [config.field]: event.target.value })}
        required={config.required}
        autoComplete="off"
        className="h-10 w-24 rounded-lg border border-foreground/15 bg-background px-2 text-end tabular-nums focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none"
      />
      <span className="w-8 text-sm text-foreground/60">{unitText}</span>
    </div>
  );
};
