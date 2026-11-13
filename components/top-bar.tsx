import { Salad } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { UserMenu } from "@/components/user-menu";
import { getCurrentUser } from "@/lib/auth/current-user";
import { DEMO_EMAIL } from "@/lib/auth/demo-login";

export function TopBar() {
  return (
    <header className="sticky top-0 z-10 border-b border-black/10 bg-background/95 pt-[env(safe-area-inset-top)] backdrop-blur dark:border-white/10">
      <div className="mx-auto flex h-14 max-w-md items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <Salad aria-hidden className="size-5 text-brand" />
          Bite Buddy
        </Link>
        {/* The session is read per request, so it streams in after the static shell. */}
        <Suspense
          fallback={<span className="size-8 animate-pulse rounded-full bg-foreground/10" />}
        >
          <CurrentUserMenu />
        </Suspense>
      </div>
    </header>
  );
}

async function CurrentUserMenu() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <Link href="/sign-in" className="text-sm font-medium text-brand">
        התחברות
      </Link>
    );
  }
  // The demo account's placeholder address means nothing to the people using it.
  const email = user.email === DEMO_EMAIL ? null : user.email;
  return <UserMenu name={user.name} email={email} image={user.image} />;
}
