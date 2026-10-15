"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { STATUSES } from "@/lib/constants";
import type { ListingStatus } from "@/lib/types";
import { storagePathFromUrl } from "@/lib/utils";

async function requireUser() {
  const { supabase, user } = await getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

function field(formData: FormData, name: string, max: number) {
  return String(formData.get(name) ?? "").trim().slice(0, max);
}

export async function updateProfile(formData: FormData) {
  const { supabase, user } = await requireUser();
  const full_name = field(formData, "full_name", 80);
  if (!full_name) redirect("/profile?error=name");

  await supabase
    .from("profiles")
    .update({
      full_name,
      hostel: field(formData, "hostel", 80) || null,
      phone: field(formData, "phone", 20) || null,
    })
    .eq("id", user.id);

  revalidatePath("/", "layout");
  redirect("/profile?saved=1");
}

export async function setListingStatus(listingId: string, status: ListingStatus) {
  if (!STATUSES.includes(status)) throw new Error("Invalid status");
  const { supabase, user } = await requireUser();

  await supabase.from("listings").update({ status }).eq("id", listingId).eq("seller_id", user.id);

  revalidatePath(`/listings/${listingId}`);
  revalidatePath("/my");
  revalidatePath("/");
}

export async function deleteListing(listingId: string) {
  const { supabase, user } = await requireUser();

  const { data: listing } = await supabase
    .from("listings")
    .select("images")
    .eq("id", listingId)
    .eq("seller_id", user.id)
    .single();
  if (!listing) redirect("/my");

  const paths = (listing.images as string[]).map(storagePathFromUrl).filter((p): p is string => !!p);
  if (paths.length) await supabase.storage.from("listing-images").remove(paths);
  await supabase.from("listings").delete().eq("id", listingId).eq("seller_id", user.id);

  revalidatePath("/");
  redirect("/my");
}

export async function startConversation(listingId: string) {
  const { supabase, user } = await requireUser();

  const { data: listing } = await supabase.from("listings").select("seller_id").eq("id", listingId).single();
  if (!listing || listing.seller_id === user.id) redirect(`/listings/${listingId}`);

  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("listing_id", listingId)
    .eq("buyer_id", user.id)
    .maybeSingle();

  let conversationId = existing?.id as string | undefined;
  if (!conversationId) {
    const { data: created, error } = await supabase
      .from("conversations")
      .insert({ listing_id: listingId, buyer_id: user.id, seller_id: listing.seller_id })
      .select("id")
      .single();
    if (error || !created) throw new Error("Could not start a conversation. Please try again.");
    conversationId = created.id as string;
  }

  redirect(`/messages/${conversationId}`);
}
