import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import type { Listing } from "@/lib/types";
import ListingCard from "@/components/ListingCard";

export default async function MyListingsPage() {
  const { supabase, user } = await getUser();
  if (!user) redirect("/login?next=/my");

  const { data } = await supabase
    .from("listings")
    .select("id, title, price, condition, images, status, location, created_at")
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false });
  const listings = (data ?? []) as Listing[];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My listings</h1>
        <Link href="/listings/new" className="btn-primary">
          Sell an item
        </Link>
      </div>
      {listings.length === 0 ? (
        <p className="card p-8 text-center text-slate-600">You have not listed anything yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {listings.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      )}
    </div>
  );
}
