const NUTRI_SCORE_COLORS: Record<string, string> = {
  a: "bg-[#038141]",
  b: "bg-[#85bb2f]",
  c: "bg-[#fecb02] text-neutral-900",
  d: "bg-[#ee8100]",
  e: "bg-[#e63e11]",
};

const NOVA_LABELS: Record<number, string> = {
  1: "לא מעובד או מעובד מעט",
  2: "רכיב בישול מעובד",
  3: "מזון מעובד",
  4: "מזון אולטרה־מעובד",
};

const badge = "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold";

export const NutriScoreBadge = ({ grade }: { grade: string }) => (
  <span
    title={`Nutri-Score ${grade.toUpperCase()}`}
    dir="ltr"
    className={`${badge} text-white ${NUTRI_SCORE_COLORS[grade] ?? "bg-foreground/40"}`}
  >
    Nutri-Score {grade.toUpperCase()}
  </span>
);

export const NovaBadge = ({ group }: { group: number }) => (
  <span title={NOVA_LABELS[group]} dir="ltr" className={`${badge} bg-foreground/10`}>
    NOVA {group}
  </span>
);
