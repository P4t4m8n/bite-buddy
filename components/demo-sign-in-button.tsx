"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth/client";

type DemoSignInButtonProps = {
  callbackUrl?: string;
  disabled?: boolean;
};

export default function DemoSignInButton({
  callbackUrl = "/",
  disabled = false,
}: DemoSignInButtonProps) {
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  const handleClick = async () => {
    setPending(true);
    setFailed(false);
    const { error } = await authClient.$fetch("/demo/sign-in", { method: "POST", body: {} });
    if (error) {
      setPending(false);
      setFailed(true);
      return;
    }
    // A full load, so every server component reads the new session cookie.
    window.location.assign(callbackUrl);
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || pending}
        className="h-12 w-full rounded-full border border-black/15 px-5 font-medium transition-colors hover:bg-foreground/5 disabled:opacity-60 dark:border-white/15"
      >
        {pending ? "מתחבר…" : "כניסה למשתמש דמו"}
      </button>
      <p className="text-xs text-foreground/60">
        בלי מייל ובלי תמונה. חשבון הדמו משותף לכל מי שנכנס אליו, כך שכולם רואים את אותם נתונים.
      </p>
      {failed ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          הכניסה לדמו נכשלה. נסו שוב.
        </p>
      ) : null}
    </div>
  );
}
