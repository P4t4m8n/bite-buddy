import { Suspense } from "react";

import { requireUser } from "@/lib/auth/current-user";
import { getUserSettings } from "@/lib/user/settings";

import { PageHeader } from "@/components/page-header";
import GoalsForm from "@/components/settings/goals-form";
import WeekStartSetting from "@/components/settings/week-start-setting";
import MealEditorSkeleton from "@/components/skeletons/mealEditorSkeleton";

import type { Metadata } from "next";

export const metadata: Metadata = { title: "הגדרות" };

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="הגדרות" description="יעדים יומיים והעדפות." />
      <Suspense fallback={<MealEditorSkeleton />}>
        <SettingsLoader />
      </Suspense>
    </>
  );
}

const SettingsLoader = async () => {
  const user = await requireUser();
  const settings = await getUserSettings(user.id);
  return (
    <div className="space-y-8">
      <GoalsForm goals={settings.goals} />
      <WeekStartSetting value={settings.weekStartsOn} />
      <p className="text-xs text-foreground/60">אזור זמן: {settings.timezone}</p>
    </div>
  );
};
