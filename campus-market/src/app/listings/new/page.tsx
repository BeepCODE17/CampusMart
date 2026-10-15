import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import ListingForm from "./ListingForm";

export default async function NewListingPage() {
  const { user } = await getUser();
  if (!user) redirect("/login?next=/listings/new");

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 text-2xl font-bold">Sell an item</h1>
      <ListingForm userId={user.id} />
    </div>
  );
}
