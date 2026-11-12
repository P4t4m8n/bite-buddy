import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "ארוחות" };

export default function MealsPage() {
  return <PageHeader title="ארוחות" description="בונים ארוחות ומשתמשים בהן שוב." />;
}
