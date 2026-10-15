import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { updateProfile } from "@/app/actions";
import type { Profile } from "@/lib/types";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { saved, error } = await searchParams;
  const { supabase, user } = await getUser();
  if (!user) redirect("/login?next=/profile");

  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const profile = data as Profile | null;

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="text-2xl font-bold">Your profile</h1>
      <form action={updateProfile} className="card space-y-4 p-5 sm:p-6">
        <div>
          <span className="label">Email</span>
          <p className="text-sm text-slate-600">{user.email}</p>
        </div>
        <div>
          <label className="label" htmlFor="full_name">Name</label>
          <input id="full_name" name="full_name" required maxLength={80} defaultValue={profile?.full_name ?? ""} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="hostel">Hostel / area (optional)</label>
          <input id="hostel" name="hostel" maxLength={80} defaultValue={profile?.hostel ?? ""} className="input" placeholder="e.g. Hostel 4" />
        </div>
        <div>
          <label className="label" htmlFor="phone">Phone (optional)</label>
          <input id="phone" name="phone" type="tel" maxLength={20} defaultValue={profile?.phone ?? ""} className="input" />
          <p className="mt-1 text-xs text-slate-500">
            Shown to signed-in students on your listings. Leave blank to be contacted only through Messages.
          </p>
        </div>
        {saved && <p className="text-sm text-green-700">Profile saved.</p>}
        {error && <p className="text-sm text-red-600">Please enter your name.</p>}
        <button className="btn-primary w-full">Save</button>
      </form>
      <form action="/auth/signout" method="post">
        <button className="btn-secondary w-full">Sign out</button>
      </form>
    </div>
  );
}
