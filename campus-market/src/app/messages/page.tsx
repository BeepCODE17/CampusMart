import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { timeAgo } from "@/lib/utils";

interface ConversationRow {
  id: string;
  buyer_id: string;
  last_message_at: string;
  listing: { id: string; title: string; images: string[] } | null;
  buyer: { full_name: string } | null;
  seller: { full_name: string } | null;
}

export default async function MessagesPage() {
  const { supabase, user } = await getUser();
  if (!user) redirect("/login?next=/messages");

  const { data } = await supabase
    .from("conversations")
    .select(
      "id, buyer_id, last_message_at, listing:listings(id, title, images), buyer:profiles!conversations_buyer_id_fkey(full_name), seller:profiles!conversations_seller_id_fkey(full_name)",
    )
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order("last_message_at", { ascending: false });
  const conversations = (data ?? []) as unknown as ConversationRow[];

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">Messages</h1>
      {conversations.length === 0 ? (
        <p className="card p-8 text-center text-slate-600">
          No conversations yet. Tap &quot;Message seller&quot; on a listing to start one.
        </p>
      ) : (
        <ul className="card divide-y divide-slate-100">
          {conversations.map((c) => {
            const buying = c.buyer_id === user.id;
            const other = buying ? c.seller : c.buyer;
            const cover = c.listing?.images[0];
            return (
              <li key={c.id}>
                <Link href={`/messages/${c.id}`} className="flex items-center gap-3 p-3 hover:bg-slate-50">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {cover && <img src={cover} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{other?.full_name || "Student"}</p>
                    <p className="truncate text-sm text-slate-600">
                      {buying ? "Buying" : "Selling"}: {c.listing?.title ?? "Deleted listing"}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-slate-500">{timeAgo(c.last_message_at)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
