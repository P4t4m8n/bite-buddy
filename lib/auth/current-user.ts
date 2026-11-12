import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "@/lib/auth/server";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  image: string | null;
};

/** The signed-in user, or null. Validates the session once per request. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const { id, name, email, image } = session.user;
  return { id, name, email, image: image ?? null };
});

/** For pages: redirects to sign-in when there is no valid session. */
export const requireUser = async (): Promise<CurrentUser> => {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  return user;
};
