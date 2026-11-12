// Background and text colour together, so grade C (yellow) gets dark text.
const NUTRI_SCORE_COLORS: Record<string, string> = {
  a: "bg-[#038141] text-white",
  b: "bg-[#4f7a1c] text-white",
  c: "bg-[#fecb02] text-neutral-900",
  d: "bg-[#ee8100] text-neutral-900",
  e: "bg-[#c4300c] text-white",
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
    className={`${badge} ${NUTRI_SCORE_COLORS[grade] ?? "bg-foreground/40 text-white"}`}
  >
    Nutri-Score {grade.toUpperCase()}
  </span>
);

export const NovaBadge = ({ group }: { group: number }) => (
  <span title={NOVA_LABELS[group]} dir="ltr" className={`${badge} bg-foreground/10`}>
    NOVA {group}
  </span>
);
