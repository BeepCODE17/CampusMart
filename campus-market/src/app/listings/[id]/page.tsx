import Link from "next/link";
import { notFound } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import type { Listing } from "@/lib/types";
import { categoryLabel, conditionLabel, formatPrice, timeAgo } from "@/lib/utils";
import { startConversation } from "@/app/actions";
import StatusBadge from "@/components/StatusBadge";
import ImageGallery from "./ImageGallery";
import OwnerActions from "./OwnerActions";

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await getUser();

  const { data } = await supabase
    .from("listings")
    .select("*, seller:profiles(full_name, hostel, phone)")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();

  const listing = data as Listing;
  const isOwner = user?.id === listing.seller_id;

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_360px]">
      <ImageGallery images={listing.images} title={listing.title} />

      <div className="space-y-4">
        <div className="card space-y-3 p-5">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-xl font-bold">{listing.title}</h1>
            <StatusBadge status={listing.status} />
          </div>
          <p className="text-2xl font-bold text-brand-600">{formatPrice(listing.price)}</p>
          <dl className="grid grid-cols-2 gap-y-1 text-sm">
            <dt className="text-slate-500">Category</dt>
            <dd>
              <Link href={`/?category=${listing.category}`} className="hover:underline">
                {categoryLabel(listing.category)}
              </Link>
            </dd>
            <dt className="text-slate-500">Condition</dt>
            <dd>{conditionLabel(listing.condition)}</dd>
            {listing.location && (
              <>
                <dt className="text-slate-500">Pickup</dt>
                <dd>{listing.location}</dd>
              </>
            )}
            <dt className="text-slate-500">Posted</dt>
            <dd>{timeAgo(listing.created_at)}</dd>
          </dl>
        </div>

        <div className="card space-y-3 p-5">
          <p className="text-sm text-slate-500">Seller</p>
          <p className="font-medium">
            {listing.seller?.full_name || "Student"}
            {listing.seller?.hostel && <span className="font-normal text-slate-500"> · {listing.seller.hostel}</span>}
          </p>
          {isOwner ? (
            <OwnerActions listingId={listing.id} status={listing.status} />
          ) : listing.status === "sold" ? (
            <p className="text-sm text-slate-600">This item has been sold.</p>
          ) : (
            <form action={startConversation.bind(null, listing.id)}>
              <button className="btn-primary w-full">Message seller</button>
            </form>
          )}
          {!isOwner && listing.seller?.phone && listing.status !== "sold" && (
            <p className="text-sm text-slate-600">
              Phone: <a href={`tel:${listing.seller.phone}`} className="text-brand-600 hover:underline">{listing.seller.phone}</a>
            </p>
          )}
        </div>

        {listing.description && (
          <div className="card p-5">
            <h2 className="mb-2 font-semibold">Description</h2>
            <p className="whitespace-pre-line text-sm text-slate-700">{listing.description}</p>
          </div>
        )}

        <p className="text-xs text-slate-500">
          Safety tip: meet in a public spot on campus, check the item before paying, and never pay in advance.
        </p>
      </div>
    </div>
  );
}
