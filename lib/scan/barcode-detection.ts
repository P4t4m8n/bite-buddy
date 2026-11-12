// Browser-only: runs barcode detection on a playing <video>.

import type { DecodeHintType as ZxingHint } from "@zxing/library";

const SCAN_INTERVAL_MS = 200;
const NATIVE_FORMATS = ["ean_13", "ean_8", "upc_a", "upc_e"];

// The Barcode Detection API isn't in TypeScript's DOM types yet.
type DetectedBarcode = { rawValue: string };
type NativeDetector = { detect: (source: HTMLVideoElement) => Promise<DetectedBarcode[]> };
type NativeDetectorClass = {
  new (options: { formats: string[] }): NativeDetector;
  getSupportedFormats: () => Promise<string[]>;
};

export type DetectionEngine = "native" | "zxing";
export type StopDetection = () => void;

const nativeDetectorClass = async (): Promise<NativeDetectorClass | null> => {
  const Detector = (window as unknown as { BarcodeDetector?: NativeDetectorClass }).BarcodeDetector;
  if (!Detector) return null;
  try {
    const supported = await Detector.getSupportedFormats();
    return supported.includes("ean_13") ? Detector : null;
  } catch {
    return null;
  }
};

const startNative = (
  Detector: NativeDetectorClass,
  video: HTMLVideoElement,
  onCode: (code: string) => void,
): StopDetection => {
  const detector = new Detector({ formats: NATIVE_FORMATS });
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const tick = async () => {
    if (stopped) return;
    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      try {
        const [first] = await detector.detect(video);
        if (first?.rawValue && !stopped) onCode(first.rawValue);
      } catch {
        // A frame can fail to decode (for example while the video resizes); try the next one.
      }
    }
    if (!stopped) timer = setTimeout(tick, SCAN_INTERVAL_MS);
  };
  void tick();

  return () => {
    stopped = true;
    clearTimeout(timer);
  };
};

// iOS Safari and Firefox have no BarcodeDetector; ZXing is loaded only for them.
const startZxing = async (
  video: HTMLVideoElement,
  onCode: (code: string) => void,
): Promise<StopDetection> => {
  const [{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType }] = await Promise.all([
    import("@zxing/browser"),
    import("@zxing/library"),
  ]);
  const hints = new Map<ZxingHint, unknown>([
    [
      DecodeHintType.POSSIBLE_FORMATS,
      [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E],
    ],
  ]);
  const reader = new BrowserMultiFormatReader(hints, {
    delayBetweenScanAttempts: SCAN_INTERVAL_MS,
  });
  const controls = await reader.decodeFromVideoElement(video, (result) => {
    if (result) onCode(result.getText());
  });
  return () => controls.stop();
};

/** Starts scanning `video` with the native BarcodeDetector, or ZXing as a fallback. */
export const startBarcodeDetection = async (
  video: HTMLVideoElement,
  onCode: (code: string) => void,
): Promise<{ engine: DetectionEngine; stop: StopDetection }> => {
  const Detector = await nativeDetectorClass();
  if (Detector) return { engine: "native", stop: startNative(Detector, video, onCode) };
  return { engine: "zxing", stop: await startZxing(video, onCode) };
};

type TorchCapabilities = MediaTrackCapabilities & { torch?: boolean };

export const supportsTorch = (track: MediaStreamTrack): boolean =>
  Boolean((track.getCapabilities?.() as TorchCapabilities | undefined)?.torch);

export const setTorch = (track: MediaStreamTrack, on: boolean) =>
  track.applyConstraints({ advanced: [{ torch: on } as MediaTrackConstraintSet] });
