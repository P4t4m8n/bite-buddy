const NOVA_LABELS: Record<number, string> = {
  1: "לא מעובד או מעובד מעט",
  2: "רכיב בישול מעובד",
  3: "מזון מעובד",
  4: "מזון אולטרה־מעובד",
};

export default function NovaBadge({ group }: { group: number }) {
  return (
    <span
      title={NOVA_LABELS[group]}
      dir="ltr"
      className="inline-flex items-center gap-1 rounded-full bg-foreground/10 px-2.5 py-1 text-xs font-semibold"
    >
      NOVA {group}
    </span>
  );
}
