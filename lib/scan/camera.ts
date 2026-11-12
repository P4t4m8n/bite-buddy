export type CameraProblem = "denied" | "no-camera" | "busy" | "error";

/** Maps a getUserMedia error to a state the scanner can explain to the user. */
export const cameraProblem = (error: unknown): CameraProblem => {
  const name = error instanceof Error || error instanceof DOMException ? error.name : "";
  switch (name) {
    case "NotAllowedError":
    case "SecurityError":
    case "PermissionDeniedError":
      return "denied";
    case "NotFoundError":
    case "OverconstrainedError":
    case "DevicesNotFoundError":
      return "no-camera";
    case "NotReadableError":
    case "TrackStartError":
      return "busy";
    default:
      return "error";
  }
};

/**
 * Cameras report the same barcode many times a second. Returns a function that
 * accepts a read only if the same code wasn't accepted within the last `windowMs`.
 */
export const createReadDebouncer = (windowMs: number) => {
  let last: { code: string; at: number } | null = null;
  return (code: string, now: number): boolean => {
    if (last && last.code === code && now - last.at < windowMs) return false;
    last = { code, at: now };
    return true;
  };
};
