"use client";

import {
  Camera,
  CameraOff,
  Flashlight,
  FlashlightOff,
  LoaderCircle,
  Lock,
  PackagePlus,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { createFoodHref, parseBarcode } from "@/lib/food/barcode";
import { setTorch, startBarcodeDetection, supportsTorch } from "@/lib/scan/barcode-detection";
import { cameraProblem, createReadDebouncer } from "@/lib/scan/camera";

import ManualBarcodeForm from "@/components/scan/manual-barcode-form";

import type { BarcodeLookupResult } from "@/lib/food/barcode";
import type { CameraProblem } from "@/lib/scan/camera";

const DUPLICATE_READ_MS = 3000;

type CameraState =
  | { kind: "starting" }
  | { kind: "scanning"; torchSupported: boolean }
  | { kind: "insecure" }
  | { kind: "unsupported" }
  | { kind: CameraProblem };

type MissingResult = Exclude<BarcodeLookupResult, { status: "found" }>;

type LookupState =
  | { kind: "idle" }
  | { kind: "loading"; code: string }
  | { kind: "failed"; code: string; message: string }
  | { kind: "missing"; result: MissingResult };

export default function BarcodeScanner() {
  const router = useRouter();
  const [lookup, setLookup] = useState<LookupState>({ kind: "idle" });
  const busy = lookup.kind !== "idle";

  const find = useCallback(
    async (code: string) => {
      setLookup({ kind: "loading", code });
      try {
        const response = await fetch(`/api/foods/barcode/${code}`);
        if (response.status === 401) {
          setLookup({ kind: "failed", code, message: "פג תוקף ההתחברות. התחברו מחדש ונסו שוב." });
          return;
        }
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result = (await response.json()) as BarcodeLookupResult;
        if (result.status === "found") {
          router.push(`/food/${result.food.id}`);
          return;
        }
        setLookup({ kind: "missing", result });
      } catch {
        setLookup({ kind: "failed", code, message: "החיפוש נכשל. בדקו את החיבור ונסו שוב." });
      }
    },
    [router],
  );

  return (
    <div className="space-y-6">
      <CameraView paused={busy} onCode={find} />

      {lookup.kind === "idle" ? null : (
        <LookupStatus lookup={lookup} onRetry={find} onReset={() => setLookup({ kind: "idle" })} />
      )}

      <ManualBarcodeForm disabled={lookup.kind === "loading"} onSubmit={find} />
    </div>
  );
}

// ─── Camera ──────────────────────────────────────────────────────────────────

type CameraViewProps = {
  paused: boolean;
  onCode: (code: string) => void;
};

const CameraView = ({ paused, onCode }: CameraViewProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const trackRef = useRef<MediaStreamTrack | null>(null);
  const [camera, setCamera] = useState<CameraState>({ kind: "starting" });
  const [attempt, setAttempt] = useState(0);
  const [torchOn, setTorchOn] = useState(false);

  // Detection runs in a long-lived loop, so it reads the latest props through a ref.
  const latest = useRef({ paused, onCode });
  useEffect(() => {
    latest.current = { paused, onCode };
  });

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let cancelled = false;
    let stream: MediaStream | null = null;
    let stopDetection: (() => void) | null = null;
    const accept = createReadDebouncer(DUPLICATE_READ_MS);

    // Safe to call more than once; also runs when the effect was cleaned up mid-start.
    const release = () => {
      stopDetection?.();
      stopDetection = null;
      stream?.getTracks().forEach((track) => track.stop());
      stream = null;
      video.srcObject = null;
      trackRef.current = null;
    };

    const handleRead = (raw: string) => {
      const code = parseBarcode(raw);
      if (!code || latest.current.paused || !accept(code, Date.now())) return;
      navigator.vibrate?.(80);
      latest.current.onCode(code);
    };

    const start = async () => {
      if (!window.isSecureContext) return setCamera({ kind: "insecure" });
      if (!navigator.mediaDevices?.getUserMedia) return setCamera({ kind: "unsupported" });
      setCamera({ kind: "starting" });

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        if (cancelled) return release();
        video.srcObject = stream;
        await video.play();
        const detection = await startBarcodeDetection(video, handleRead);
        stopDetection = detection.stop;
        if (cancelled) return release();

        const [track] = stream.getVideoTracks();
        trackRef.current = track ?? null;
        setCamera({ kind: "scanning", torchSupported: track ? supportsTorch(track) : false });
      } catch (error) {
        if (cancelled) return release();
        release();
        setCamera({ kind: cameraProblem(error) });
      }
    };
    void start();

    // Stop the camera when leaving the page (also on client-side navigation).
    return () => {
      cancelled = true;
      release();
      setTorchOn(false);
    };
  }, [attempt]);

  const toggleTorch = async () => {
    const track = trackRef.current;
    if (!track) return;
    try {
      await setTorch(track, !torchOn);
      setTorchOn(!torchOn);
    } catch {
      setTorchOn(false);
    }
  };

  const scanning = camera.kind === "scanning";

  return (
    <section aria-label="מצלמה" className="space-y-2">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-neutral-900 text-white">
        <video
          ref={videoRef}
          muted
          playsInline
          aria-hidden
          className={`size-full object-cover ${scanning ? "" : "invisible"}`}
        />
        {scanning ? (
          <>
            <ScanFrame />
            {camera.torchSupported ? (
              <button
                type="button"
                onClick={toggleTorch}
                aria-pressed={torchOn}
                aria-label={torchOn ? "כיבוי פנס" : "הדלקת פנס"}
                className="absolute end-3 top-3 flex size-10 items-center justify-center rounded-full bg-black/50"
              >
                {torchOn ? <FlashlightOff className="size-5" /> : <Flashlight className="size-5" />}
              </button>
            ) : null}
          </>
        ) : (
          <CameraMessage camera={camera} onRetry={() => setAttempt((n) => n + 1)} />
        )}
      </div>
      <p role="status" className="text-center text-sm text-foreground/60">
        {scanning ? (paused ? "הסריקה מושהית" : "כוונו את הברקוד למסגרת") : null}
      </p>
    </section>
  );
};

const ScanFrame = () => (
  <div
    aria-hidden
    className="pointer-events-none absolute inset-0 flex items-center justify-center"
  >
    <div className="h-1/3 w-3/4 rounded-xl border-2 border-white/80 shadow-[0_0_0_9999px_rgb(0_0_0/0.35)]" />
  </div>
);

const CAMERA_MESSAGES: Record<Exclude<CameraState["kind"], "scanning">, string> = {
  starting: "מבקשים גישה למצלמה…",
  insecure:
    "המצלמה זמינה רק בחיבור מאובטח (HTTPS). לבדיקה בטלפון ברשת המקומית מריצים את שרת הפיתוח עם next dev --experimental-https ונכנסים לכתובת ה־https.",
  unsupported: "הדפדפן הזה לא תומך בגישה למצלמה.",
  denied: "אין הרשאה להשתמש במצלמה. אפשר לאשר גישה בהגדרות הדפדפן ולנסות שוב.",
  "no-camera": "לא נמצאה מצלמה במכשיר.",
  busy: "המצלמה בשימוש על ידי אפליקציה אחרת.",
  error: "לא הצלחנו להפעיל את המצלמה.",
};

type CameraMessageProps = {
  camera: Exclude<CameraState, { kind: "scanning" }>;
  onRetry: () => void;
};

const CameraMessage = ({ camera, onRetry }: CameraMessageProps) => {
  const starting = camera.kind === "starting";
  const canRetry = camera.kind === "denied" || camera.kind === "busy" || camera.kind === "error";
  const Icon = starting ? LoaderCircle : camera.kind === "insecure" ? Lock : CameraOff;

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
      <Icon aria-hidden className={`size-8 text-white/70 ${starting ? "animate-spin" : ""}`} />
      <p className="text-sm text-white/90">{CAMERA_MESSAGES[camera.kind]}</p>
      {starting ? null : <p className="text-xs text-white/60">אפשר להקליד את הברקוד ידנית למטה.</p>}
      {canRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-2 text-sm"
        >
          <Camera aria-hidden className="size-4" />
          ניסיון חוזר
        </button>
      ) : null}
    </div>
  );
};

// ─── Lookup ──────────────────────────────────────────────────────────────────

type LookupStatusProps = {
  lookup: Exclude<LookupState, { kind: "idle" }>;
  onRetry: (code: string) => void;
  onReset: () => void;
};

const LookupStatus = ({ lookup, onRetry, onReset }: LookupStatusProps) => {
  if (lookup.kind === "loading") {
    return (
      <p role="status" className="flex items-center justify-center gap-2 text-sm">
        <LoaderCircle aria-hidden className="size-4 animate-spin text-brand" />
        מחפשים את הברקוד <Barcode code={lookup.code} />…
      </p>
    );
  }

  if (lookup.kind === "failed") {
    return (
      <div role="alert" className="space-y-3 rounded-2xl border border-red-500/30 p-4">
        <p className="text-sm">{lookup.message}</p>
        <button
          type="button"
          onClick={() => onRetry(lookup.code)}
          className="flex items-center gap-1.5 text-sm font-medium text-brand"
        >
          <RotateCcw aria-hidden className="size-4" />
          ניסיון חוזר
        </button>
      </div>
    );
  }

  const { result } = lookup;
  const barcode = result.status === "incomplete" ? result.prefill.barcode : result.barcode;

  return (
    <div role="alert" className="space-y-3 rounded-2xl border border-foreground/15 p-4">
      {result.status === "incomplete" ? (
        <p className="text-sm">
          מצאנו את המוצר {result.prefill.name ? <strong>{result.prefill.name}</strong> : null}{" "}
          (ברקוד <Barcode code={barcode} />) אבל חסרים בו נתונים, כמו ערכים תזונתיים או שם בעברית.
        </p>
      ) : (
        <p className="text-sm">
          לא מצאנו מוצר עם הברקוד <Barcode code={barcode} />.
          {result.offUnavailable
            ? " מאגר Open Food Facts לא זמין כרגע, אפשר לנסות שוב מאוחר יותר."
            : null}
        </p>
      )}
      <p className="text-sm text-foreground/60">אפשר ליצור אותו כמוצר משלכם.</p>
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={createFoodHref(
            barcode,
            result.status === "incomplete" ? result.prefill : undefined,
          )}
          prefetch={false}
          className="flex h-11 items-center gap-2 rounded-full bg-brand px-5 font-medium text-white"
        >
          <PackagePlus aria-hidden className="size-4" />
          יצירת מוצר
        </Link>
        <button
          type="button"
          onClick={onReset}
          className="flex h-11 items-center gap-2 rounded-full border border-foreground/15 px-5 font-medium"
        >
          <RotateCcw aria-hidden className="size-4" />
          סריקה נוספת
        </button>
      </div>
    </div>
  );
};

const Barcode = ({ code }: { code: string }) => (
  <bdi dir="ltr" className="font-medium tabular-nums">
    {code}
  </bdi>
);
