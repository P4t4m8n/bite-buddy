/**
 * Turns a sign-in `callbackUrl` (relative or absolute) into a same-origin path,
 * so a crafted link can't redirect users to another site after signing in.
 */
export function safeCallbackUrl(value: unknown): string {
  if (typeof value !== "string" || !value) return "/";
  try {
    const url = new URL(value, "http://localhost");
    const path = `${url.pathname}${url.search}${url.hash}`;
    if (path.startsWith("//") || url.pathname.startsWith("/sign-in")) return "/";
    return path;
  } catch {
    return "/";
  }
}
