"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { Avatar } from "@/components/avatar";
import { authClient } from "@/lib/auth/client";

type UserMenuProps = { name: string; email: string; image: string | null };

export function UserMenu({ name, email, image }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const router = useRouter();

  const handleSignOut = async () => {
    setSigningOut(true);
    await authClient.signOut();
    router.push("/sign-in");
    router.refresh();
  };

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
        className="flex rounded-full ring-brand/40 focus-visible:ring-2 focus-visible:outline-none"
      >
        <Avatar name={name} image={image} />
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 mt-2 w-60 rounded-xl border border-black/10 bg-background p-2 shadow-lg dark:border-white/10"
        >
          <div className="px-2 py-1.5">
            <p className="truncate text-sm font-medium">{name}</p>
            <p className="truncate text-xs text-foreground/60">{email}</p>
          </div>
          <hr className="my-1 border-black/10 dark:border-white/10" />
          <button
            type="button"
            role="menuitem"
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-foreground/5 disabled:opacity-60"
          >
            <LogOut aria-hidden className="size-4" />
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
