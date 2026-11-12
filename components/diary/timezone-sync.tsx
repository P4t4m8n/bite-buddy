"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Saves the browser's time zone when it differs from the stored one, so days match the user's clock. */
export default function TimezoneSync({ stored }: { stored: string }) {
  const router = useRouter();

  useEffect(() => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!timezone || timezone === stored) return;
    void fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timezone }),
    }).then((response) => {
      if (response.ok) router.refresh();
    });
  }, [stored, router]);

  return null;
}
