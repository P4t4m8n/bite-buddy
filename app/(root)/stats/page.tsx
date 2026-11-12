import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "סטטיסטיקה" };

export default function StatsPage() {
  return <PageHeader title="סטטיסטיקה" description="המאקרו השבועי והמגמות שלך." />;
}
