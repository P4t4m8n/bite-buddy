"use client";

import { Copy, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

/** Saves a private copy of a public meal and opens it in the editor. */
export default function CopyMealButton({ mealId }: { mealId: string }) {
  const router = useRouter();
  const [copying, setCopying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const copy = async () => {
    setCopying(true);
    setError(null);
    try {
      const response = await fetch(`/api/meals/${mealId}/copy`, { method: "POST" });
      if (!response.ok) throw new Error(`Copy failed: ${response.status}`);
      const { id } = (await response.json()) as { id: string };
      router.push(`/meals/${id}`);
    } catch {
      setError("לא הצלחנו לשמור עותק. נסו שוב.");
      setCopying(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={copy}
        disabled={copying}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand font-medium text-brand-foreground disabled:opacity-50"
      >
        {copying ? (
          <LoaderCircle aria-hidden className="size-4 animate-spin" />
        ) : (
          <Copy aria-hidden className="size-4" />
        )}
        שמירת עותק
      </button>
      {error ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
