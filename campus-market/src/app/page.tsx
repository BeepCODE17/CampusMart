import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CATEGORIES } from "@/lib/constants";
import type { Listing } from "@/lib/types";
import ListingCard from "@/components/ListingCard";

const PAGE_SIZE = 24;

type Params = { q?: string; category?: string; sort?: string; page?: string };

function hrefWith(params: Params, changes: Partial<Params>) {
  const merged = { ...params, ...changes };
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(merged)) if (value) search.set(key, value);
  const qs = search.toString();
  return qs ? `/?${qs}` : "/";
}

export default async function BrowsePage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const category = CATEGORIES.some((c) => c.value === params.category) ? params.category : undefined;
  const sort = params.sort ?? "new";
  const page = Math.max(1, Number(params.page) || 1);

  const supabase = await createClient();
  let query = supabase
    .from("listings")
    .select("id, title, price, condition, images, status, location, created_at")
    .in("status", ["available", "reserved"]);

  if (q) query = query.textSearch("search", q, { type: "websearch", config: "english" });
  if (category) query = query.eq("category", category);
  if (sort === "price_asc") query = query.order("price", { ascending: true });
  else if (sort === "price_desc") query = query.order("price", { ascending: false });
  query = query.order("created_at", { ascending: false });

  const from = (page - 1) * PAGE_SIZE;
  const { data, error } = await query.range(from, from + PAGE_SIZE); // one extra row tells us if there's a next page
  const rows = (data ?? []) as Listing[];
  const listings = rows.slice(0, PAGE_SIZE);
  const hasMore = rows.length > PAGE_SIZE;

  return (
    <div className="space-y-5">
      <form className="flex flex-col gap-2 sm:flex-row" action="/">
        <input
          name="q"
          defaultValue={q}
          className="input sm:flex-1"
          placeholder="Search books, cycles, coolers, calculators..."
        />
        {category && <input type="hidden" name="category" value={category} />}
        <select name="sort" defaultValue={sort} className="input sm:w-48">
          <option value="new">Newest first</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
        </select>
        <button className="btn-primary">Search</button>
      </form>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <Link
          href={hrefWith(params, { category: undefined, page: undefined })}
          className={`shrink-0 rounded-full border px-3 py-1 text-sm ${!category ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300 bg-white hover:bg-slate-100"}`}
        >
          All
        </Link>
        {CATEGORIES.map((c) => (
          <Link
            key={c.value}
            href={hrefWith(params, { category: c.value, page: undefined })}
            className={`shrink-0 rounded-full border px-3 py-1 text-sm ${category === c.value ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300 bg-white hover:bg-slate-100"}`}
          >
            {c.label}
          </Link>
        ))}
      </div>

      {error && <p className="text-sm text-red-600">Could not load listings: {error.message}</p>}

      {listings.length === 0 && !error ? (
        <div className="card p-10 text-center">
          <p className="font-medium">Nothing here yet.</p>
          <p className="mt-1 text-sm text-slate-600">Got something you no longer need? Be the first to list it.</p>
          <Link href="/listings/new" className="btn-primary mt-4">
            Sell an item
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {listings.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      )}

      {(page > 1 || hasMore) && (
        <div className="flex justify-center gap-2">
          {page > 1 && (
            <Link href={hrefWith(params, { page: String(page - 1) })} className="btn-secondary">
              Previous
            </Link>
          )}
          {hasMore && (
            <Link href={hrefWith(params, { page: String(page + 1) })} className="btn-secondary">
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
