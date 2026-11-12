import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "סריקה" };

export default function ScanPage() {
  return <PageHeader title="סריקה" description="סורקים ברקוד של מוצר עם המצלמה." />;
}
