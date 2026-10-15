import Link from "next/link";
import { getUser } from "@/lib/supabase/server";
import { APP_NAME } from "@/lib/constants";

export default async function Navbar() {
  const { user } = await getUser();

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link href="/" className="text-lg font-bold text-brand-600">
          {APP_NAME}
        </Link>
        {user && (
          <div className="ml-auto flex items-center gap-1 text-sm sm:gap-3">
            <Link href="/messages" className="rounded-md px-2 py-1 text-slate-700 hover:bg-slate-100">
              Messages
            </Link>
            <Link href="/my" className="rounded-md px-2 py-1 text-slate-700 hover:bg-slate-100">
              My listings
            </Link>
            <Link href="/profile" className="rounded-md px-2 py-1 text-slate-700 hover:bg-slate-100">
              Profile
            </Link>
            <Link href="/listings/new" className="btn-primary">
              Sell
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}
