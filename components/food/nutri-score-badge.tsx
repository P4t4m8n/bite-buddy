// Background and text colour together, so grade C (yellow) gets dark text.
const NUTRI_SCORE_COLORS: Record<string, string> = {
  a: "bg-[#038141] text-white",
  b: "bg-[#4f7a1c] text-white",
  c: "bg-[#fecb02] text-neutral-900",
  d: "bg-[#ee8100] text-neutral-900",
  e: "bg-[#c4300c] text-white",
};

export default function NutriScoreBadge({ grade }: { grade: string }) {
  return (
    <span
      title={`Nutri-Score ${grade.toUpperCase()}`}
      dir="ltr"
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${NUTRI_SCORE_COLORS[grade] ?? "bg-foreground/40 text-white"}`}
    >
      Nutri-Score {grade.toUpperCase()}
    </span>
  );
}
