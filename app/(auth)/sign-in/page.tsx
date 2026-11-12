import { Salad } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { safeCallbackUrl } from "@/lib/auth/callback-url";
import { getCurrentUser } from "@/lib/auth/current-user";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  return (
    <div className="flex flex-col items-center text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-brand/10">
        <Salad aria-hidden className="size-8 text-brand" />
      </span>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">Welcome to Bite Buddy</h1>
      <p className="mt-2 text-sm text-foreground/60">
        Scan and search foods, build meals and track your weekly macros.
      </p>

      <div className="mt-8 w-full">
        {/* searchParams and the session are request data, so they stream in. */}
        <Suspense fallback={<GoogleSignInButton disabled />}>
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

  return <GoogleSignInButton callbackUrl={redirectTo} initialError={Boolean(error)} />;
};
