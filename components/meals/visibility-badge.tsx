import { Globe, Lock } from "lucide-react";

import type { Visibility } from "@/generated/prisma/enums";

export default function VisibilityBadge({ visibility }: { visibility: Visibility }) {
  const isPublic = visibility === "PUBLIC";
  const Icon = isPublic ? Globe : Lock;
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs ${
        isPublic ? "bg-brand/10 text-brand" : "bg-foreground/5 text-foreground/60"
      }`}
    >
      <Icon aria-hidden className="size-3" />
      {isPublic ? "ציבורית" : "פרטית"}
    </span>
  );
}
