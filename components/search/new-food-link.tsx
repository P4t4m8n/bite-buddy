import { Plus } from "lucide-react";
import Link from "next/link";

export default function NewFoodLink({ query }: { query: string }) {
  return (
    <Link
      href={`/foods/new?${new URLSearchParams({ name: query })}`}
      className="mt-4 flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-foreground/20 p-3 text-sm font-medium text-brand hover:bg-brand/5"
    >
      <Plus aria-hidden className="size-4" />
      לא מצאתם? הוספת מוצר חדש
    </Link>
  );
}
