"use client";

import { Download, Share } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type Platform = "server" | "installed" | "ios" | "other";

const noSubscription = () => () => {};

const detectPlatform = (): Platform => {
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (standalone) return "installed";
  return /iphone|ipad|ipod/i.test(navigator.userAgent) ? "ios" : "other";
};

/**
 * Lets users add the app to their home screen. Chrome/Android fire `beforeinstallprompt`;
 * iOS Safari has no such event, so it shows the "Share → Add to Home Screen" steps instead.
 */
export default function InstallApp() {
  const platform = useSyncExternalStore(noSubscription, detectPlatform, () => "server" as const);
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = async () => {
    if (!promptEvent) return;
    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    setPromptEvent(null);
    if (outcome === "accepted") setInstalled(true);
  };

  const isInstalled = installed || platform === "installed";
  if (!isInstalled && !promptEvent && platform !== "ios") return null;

  return (
    <section aria-labelledby="install-heading" className="space-y-2">
      <h2 id="install-heading" className="text-lg font-semibold">
        התקנת האפליקציה
      </h2>
      {isInstalled ? (
        <p className="text-sm text-foreground/60">האפליקציה מותקנת במכשיר.</p>
      ) : promptEvent ? (
        <button
          type="button"
          onClick={install}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-brand font-medium text-brand hover:bg-brand/5"
        >
          <Download aria-hidden className="size-4" />
          הוספה למסך הבית
        </button>
      ) : (
        <p className="flex flex-wrap items-center gap-1 text-sm text-foreground/70">
          בספארי לחצו על
          <Share aria-label="שיתוף" className="size-4" />
          ואז על ״הוספה למסך הבית״.
        </p>
      )}
    </section>
  );
}
