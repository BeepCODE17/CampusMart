import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { APP_NAME } from "@/lib/constants";
import { safeNext } from "@/lib/utils";
import LoginForm from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  const { user } = await getUser();
  if (user) redirect(safeNext(next));

  return (
    <div className="mx-auto mt-10 max-w-md">
      <div className="card p-6 sm:p-8">
        <h1 className="text-2xl font-bold">Welcome to {APP_NAME}</h1>
        <p className="mt-1 text-sm text-slate-600">
          Buy and sell second-hand stuff with students on your campus. Sign in with your college email.
        </p>
        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            That sign-in link was invalid or expired. Please request a new one.
          </p>
        )}
        <LoginForm next={safeNext(next)} />
      </div>
    </div>
  );
}
