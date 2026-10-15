import Link from "next/link";
import type { Listing } from "@/lib/types";
import { conditionLabel, formatPrice, timeAgo } from "@/lib/utils";
import StatusBadge from "./StatusBadge";

type CardListing = Pick<Listing, "id" | "title" | "price" | "condition" | "images" | "status" | "location" | "created_at">;

export default function ListingCard({ listing }: { listing: CardListing }) {
  const cover = listing.images[0];

  return (
    <Link href={`/listings/${listing.id}`} className="card group overflow-hidden transition hover:shadow-md">
      <div className="relative aspect-square bg-slate-100">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt={listing.title} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">No photo</div>
        )}
        {listing.status !== "available" && (
          <div className="absolute left-2 top-2">
            <StatusBadge status={listing.status} />
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="font-semibold">{formatPrice(listing.price)}</p>
        <p className="truncate text-sm text-slate-800 group-hover:text-brand-600">{listing.title}</p>
        <p className="mt-1 truncate text-xs text-slate-500">
          {conditionLabel(listing.condition)}
          {listing.location ? ` · ${listing.location}` : ""} · {timeAgo(listing.created_at)}
        </p>
      </div>
    </Link>
  );
}
