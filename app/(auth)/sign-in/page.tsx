import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Salad } from "lucide-react";

import { safeCallbackUrl } from "@/lib/auth/callback-url";
import { getCurrentUser } from "@/lib/auth/current-user";

import DemoSignInButton from "@/components/demo-sign-in-button";
import GoogleSignInButton from "@/components/google-sign-in-button";

import type { Metadata } from "next";

export const metadata: Metadata = { title: "התחברות" };

export default function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  return (
    <div className="flex flex-col items-center text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-brand/10">
        <Salad aria-hidden className="size-8 text-brand" />
      </span>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">ברוכים הבאים ל־Bite Buddy</h1>
      <p className="mt-2 text-sm text-foreground/60">
        סורקים ומחפשים מוצרים, בונים ארוחות ועוקבים אחרי המאקרו השבועי.
      </p>

      <div className="mt-8 w-full">
        {/* searchParams and the session are request data, so they stream in. */}
        <Suspense
          fallback={
            <div className="flex flex-col gap-4">
              <GoogleSignInButton disabled />
              <DemoSignInButton disabled />
            </div>
          }
        >
          <SignInForm searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

const SignInForm = async ({ searchParams }: Pick<PageProps<"/sign-in">, "searchParams">) => {
  const { callbackUrl, error } = await searchParams;
  const redirectTo = safeCallbackUrl(callbackUrl);

  if (await getCurrentUser()) redirect(redirectTo);

  return (
    <div className="flex flex-col gap-4">
      <GoogleSignInButton callbackUrl={redirectTo} initialError={Boolean(error)} />
      <DemoSignInButton callbackUrl={redirectTo} />
    </div>
  );
};
