import type { ListingStatus } from "@/lib/types";

const styles: Record<ListingStatus, string> = {
  available: "bg-green-100 text-green-800",
  reserved: "bg-amber-100 text-amber-800",
  sold: "bg-slate-800 text-white",
};

export default function StatusBadge({ status }: { status: ListingStatus }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${styles[status]}`}>{status}</span>
  );
}
