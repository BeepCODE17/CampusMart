"use client";

import { useTransition } from "react";
import { deleteListing, setListingStatus } from "@/app/actions";
import type { ListingStatus } from "@/lib/types";

export default function OwnerActions({ listingId, status }: { listingId: string; status: ListingStatus }) {
  const [pending, startTransition] = useTransition();

  const setStatus = (next: ListingStatus) => startTransition(() => setListingStatus(listingId, next));
  const remove = () => {
    if (confirm("Delete this listing? This cannot be undone.")) startTransition(() => deleteListing(listingId));
  };

  return (
    <div className="space-y-2">
      <p className="text-sm text-slate-600">This is your listing.</p>
      <div className="flex flex-wrap gap-2">
        {status !== "available" && (
          <button className="btn-secondary" disabled={pending} onClick={() => setStatus("available")}>
            Mark available
          </button>
        )}
        {status === "available" && (
          <button className="btn-secondary" disabled={pending} onClick={() => setStatus("reserved")}>
            Mark reserved
          </button>
        )}
        {status !== "sold" && (
          <button className="btn-primary" disabled={pending} onClick={() => setStatus("sold")}>
            Mark sold
          </button>
        )}
        <button className="btn-danger" disabled={pending} onClick={remove}>
          Delete
        </button>
      </div>
    </div>
  );
}
