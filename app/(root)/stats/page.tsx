import { Suspense } from "react";

import { requireUser } from "@/lib/auth/current-user";
import { getWeeklyStats } from "@/lib/stats/queries";

import { PageHeader } from "@/components/page-header";
import DiarySkeleton from "@/components/skeletons/diarySkeleton";
import StatsView from "@/components/stats/stats-view";

import type { Metadata } from "next";

export const metadata: Metadata = { title: "סטטיסטיקה" };

export default function StatsPage({ searchParams }: PageProps<"/stats">) {
  return (
    <>
      <PageHeader title="סטטיסטיקה" description="המאקרו השבועי והמגמות שלך." />
      <Suspense fallback={<DiarySkeleton />}>
        <StatsLoader searchParams={searchParams} />
      </Suspense>
    </>
  );
}

// smart: ?week= is any day in the week to show (defaults to this week)
const StatsLoader = async ({ searchParams }: Pick<PageProps<"/stats">, "searchParams">) => {
  const { week } = await searchParams;
  const user = await requireUser();
  const stats = await getWeeklyStats(user.id, typeof week === "string" ? week : undefined);
  return <StatsView stats={stats} />;
};
