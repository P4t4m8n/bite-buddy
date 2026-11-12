"use client";

import { Calculator, LoaderCircle, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  ACTIVITY_LEVELS,
  GOAL_ADJUSTMENTS,
  suggestGoals,
  type ActivityLevel,
  type BodyProfile,
  type GoalType,
  type GoalValues,
} from "@/lib/goals/goals";

const FIELDS = [
  { key: "kcal", label: "קלוריות", unit: "קק״ל" },
  { key: "proteinG", label: "חלבון", unit: "ג׳" },
  { key: "carbsG", label: "פחמימות", unit: "ג׳" },
  { key: "fatG", label: "שומן", unit: "ג׳" },
] as const;

type GoalsFormProps = { goals: GoalValues | null };

const toText = (goals: GoalValues | null) =>
  Object.fromEntries(FIELDS.map(({ key }) => [key, goals ? String(goals[key]) : ""])) as Record<
    keyof GoalValues,
    string
  >;

const inputClass =
  "h-10 w-24 rounded-lg border border-foreground/15 bg-background px-2 text-end tabular-nums focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none";

export default function GoalsForm({ goals }: GoalsFormProps) {
  const router = useRouter();
  const [values, setValues] = useState(() => toText(goals));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/me/goals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          Object.fromEntries(FIELDS.map(({ key }) => [key, Number(values[key] || NaN)])),
        ),
      });
      const body = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) {
        setMessage({ ok: false, text: body?.message ?? "השמירה נכשלה. נסו שוב." });
        return;
      }
      setMessage({ ok: true, text: "היעדים נשמרו." });
      router.refresh();
    } catch {
      setMessage({ ok: false, text: "השמירה נכשלה. בדקו את החיבור ונסו שוב." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section aria-labelledby="goals-heading" className="space-y-4">
      <h2 id="goals-heading" className="text-lg font-semibold">
        יעדים יומיים
      </h2>

      <GoalCalculator
        onApply={(suggested) => {
          setValues(toText(suggested));
          setMessage({ ok: true, text: "היעדים המוצעים מולאו. אפשר לשנות ולשמור." });
        }}
      />

      <form onSubmit={save} noValidate className="space-y-3">
        {FIELDS.map(({ key, label, unit }) => (
          <div key={key} className="flex items-center gap-3">
            <label htmlFor={`goal-${key}`} className="flex-1 text-sm font-medium">
              {label}
            </label>
            <input
              id={`goal-${key}`}
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={values[key]}
              onChange={(event) => setValues({ ...values, [key]: event.target.value })}
              className={inputClass}
            />
            <span className="w-8 text-sm text-foreground/60">{unit}</span>
          </div>
        ))}

        {message ? (
          <p
            role={message.ok ? "status" : "alert"}
            className={`text-sm ${message.ok ? "text-foreground/70" : "text-red-600"}`}
          >
            {message.text}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={saving}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-brand font-medium text-white disabled:opacity-50"
        >
          {saving ? (
            <LoaderCircle aria-hidden className="size-4 animate-spin" />
          ) : (
            <Save aria-hidden className="size-4" />
          )}
          שמירת היעדים
        </button>
      </form>
    </section>
  );
}

const GoalCalculator = ({ onApply }: { onApply: (goals: GoalValues) => void }) => {
  const [profile, setProfile] = useState({
    sex: "male" as BodyProfile["sex"],
    age: "",
    weightKg: "",
    heightCm: "",
    activity: "light" as ActivityLevel,
    goal: "maintain" as GoalType,
  });
  const [error, setError] = useState<string | null>(null);

  const apply = () => {
    const age = Number(profile.age);
    const weightKg = Number(profile.weightKg);
    const heightCm = Number(profile.heightCm);
    if (
      !(age >= 14 && age <= 100) ||
      !(weightKg >= 30 && weightKg <= 300) ||
      !(heightCm >= 120 && heightCm <= 230)
    ) {
      setError("יש להזין גיל (14–100), משקל (30–300 ק״ג) וגובה (120–230 ס״מ).");
      return;
    }
    setError(null);
    onApply(suggestGoals({ ...profile, age, weightKg, heightCm }));
  };

  const numberField = (key: "age" | "weightKg" | "heightCm", label: string) => (
    <div className="flex items-center gap-3">
      <label htmlFor={`calc-${key}`} className="flex-1 text-sm">
        {label}
      </label>
      <input
        id={`calc-${key}`}
        type="number"
        inputMode="decimal"
        value={profile[key]}
        onChange={(event) => setProfile({ ...profile, [key]: event.target.value })}
        className={inputClass}
      />
    </div>
  );

  return (
    <details className="rounded-2xl border border-foreground/10 p-3">
      <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium">
        <Calculator aria-hidden className="size-4 text-brand" />
        חישוב יעדים מומלצים
      </summary>
      <div className="mt-3 space-y-3">
        <fieldset>
          <legend className="text-sm">מין</legend>
          <div className="mt-1 grid grid-cols-2 gap-2">
            {(["male", "female"] as const).map((sex) => (
              <label
                key={sex}
                className="flex h-10 cursor-pointer items-center justify-center rounded-lg border border-foreground/15 text-sm has-checked:border-brand has-checked:bg-brand/10 has-checked:text-brand"
              >
                <input
                  type="radio"
                  name="sex"
                  checked={profile.sex === sex}
                  onChange={() => setProfile({ ...profile, sex })}
                  className="sr-only"
                />
                {sex === "male" ? "גבר" : "אישה"}
              </label>
            ))}
          </div>
        </fieldset>
        {numberField("age", "גיל")}
        {numberField("weightKg", "משקל (ק״ג)")}
        {numberField("heightCm", "גובה (ס״מ)")}
        <div>
          <label htmlFor="calc-activity" className="text-sm">
            רמת פעילות
          </label>
          <select
            id="calc-activity"
            value={profile.activity}
            onChange={(event) =>
              setProfile({ ...profile, activity: event.target.value as ActivityLevel })
            }
            className="mt-1 h-10 w-full rounded-lg border border-foreground/15 bg-background px-2 text-sm"
          >
            {Object.entries(ACTIVITY_LEVELS).map(([key, { label }]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="calc-goal" className="text-sm">
            מטרה
          </label>
          <select
            id="calc-goal"
            value={profile.goal}
            onChange={(event) => setProfile({ ...profile, goal: event.target.value as GoalType })}
            className="mt-1 h-10 w-full rounded-lg border border-foreground/15 bg-background px-2 text-sm"
          >
            {Object.entries(GOAL_ADJUSTMENTS).map(([key, { label }]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
        {error ? (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        ) : null}
        <button
          type="button"
          onClick={apply}
          className="h-10 w-full rounded-full border border-brand text-sm font-medium text-brand hover:bg-brand/5"
        >
          מילוי יעדים מומלצים
        </button>
        <p className="text-xs text-foreground/60">
          לפי נוסחת Mifflin-St Jeor: חלבון 1.8 ג׳ לק״ג, שומן 25% מהקלוריות והשאר פחמימות. זו הערכה
          כללית בלבד.
        </p>
      </div>
    </details>
  );
};
