import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import type { Message } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import ChatThread from "./ChatThread";

interface ConversationDetail {
  id: string;
  buyer_id: string;
  listing: { id: string; title: string; price: number; status: string } | null;
  buyer: { full_name: string } | null;
  seller: { full_name: string } | null;
}

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await getUser();
  if (!user) redirect(`/login?next=/messages/${id}`);

  // RLS only returns the conversation if this user is the buyer or seller.
  const { data } = await supabase
    .from("conversations")
    .select(
      "id, buyer_id, listing:listings(id, title, price, status), buyer:profiles!conversations_buyer_id_fkey(full_name), seller:profiles!conversations_seller_id_fkey(full_name)",
    )
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  const conversation = data as unknown as ConversationDetail;

  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true })
    .limit(500);

  const other = conversation.buyer_id === user.id ? conversation.seller : conversation.buyer;

  return (
    <div className="mx-auto flex h-[calc(100dvh-8rem)] max-w-2xl flex-col">
      <div className="card mb-3 flex items-center justify-between gap-3 p-3">
        <div className="min-w-0">
          <p className="truncate font-semibold">{other?.full_name || "Student"}</p>
          {conversation.listing && (
            <Link href={`/listings/${conversation.listing.id}`} className="truncate text-sm text-brand-600 hover:underline">
              {conversation.listing.title} · {formatPrice(conversation.listing.price)}
            </Link>
          )}
        </div>
        <Link href="/messages" className="btn-secondary shrink-0">
          All chats
        </Link>
      </div>
      <ChatThread conversationId={id} userId={user.id} initialMessages={(messages ?? []) as Message[]} />
    </div>
  );
}
