"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CATEGORIES, CONDITIONS, MAX_IMAGES } from "@/lib/constants";

const MAX_DIMENSION = 1600;

/** Resize a photo in the browser so uploads stay small (phone photos are often 5MB+). */
async function shrinkImage(file: File): Promise<Blob> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error(`Could not read "${file.name}". Please use a JPG or PNG photo.`);
  }
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Could not process image"))), "image/jpeg", 0.82),
  );
}

export default function ListingForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  function addFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    setFiles((prev) => [...prev, ...picked].slice(0, MAX_IMAGES));
    e.target.value = "";
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const title = String(form.get("title")).trim();
    const price = Number(form.get("price"));
    if (title.length < 3) return setError("Title should be at least 3 characters.");
    if (!Number.isFinite(price) || price < 0) return setError("Enter a valid price (0 for free).");

    setBusy(true);
    const supabase = createClient();
    const bucket = supabase.storage.from("listing-images");
    const uploaded: string[] = [];

    try {
      for (const file of files) {
        const blob = await shrinkImage(file);
        const path = `${userId}/${crypto.randomUUID()}.jpg`;
        const { error: uploadError } = await bucket.upload(path, blob, { contentType: "image/jpeg" });
        if (uploadError) throw new Error(`Photo upload failed: ${uploadError.message}`);
        uploaded.push(path);
      }

      const { data, error: insertError } = await supabase
        .from("listings")
        .insert({
          seller_id: userId,
          title,
          description: String(form.get("description")).trim(),
          price,
          category: String(form.get("category")),
          condition: String(form.get("condition")),
          location: String(form.get("location")).trim() || null,
          images: uploaded.map((p) => bucket.getPublicUrl(p).data.publicUrl),
        })
        .select("id")
        .single();
      if (insertError || !data) throw new Error(insertError?.message ?? "Could not save listing.");

      router.push(`/listings/${data.id}`);
      router.refresh();
    } catch (err) {
      if (uploaded.length) await bucket.remove(uploaded);
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-5 p-5 sm:p-6">
      <div>
        <span className="label">Photos (up to {MAX_IMAGES})</span>
        <div className="flex flex-wrap gap-2">
          {previews.map((src, i) => (
            <div key={src} className="relative h-24 w-24 overflow-hidden rounded-lg border border-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                className="absolute right-1 top-1 rounded-full bg-black/60 px-1.5 text-xs text-white"
                aria-label="Remove photo"
              >
                ✕
              </button>
            </div>
          ))}
          {files.length < MAX_IMAGES && (
            <label className="flex h-24 w-24 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-slate-300 text-sm text-slate-500 hover:bg-slate-50">
              + Add
              <input type="file" accept="image/*" multiple className="hidden" onChange={addFiles} />
            </label>
          )}
        </div>
      </div>

      <div>
        <label className="label" htmlFor="title">Title</label>
        <input id="title" name="title" required maxLength={100} className="input" placeholder="e.g. HC Verma Physics Vol 1 & 2" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="price">Price</label>
          <input id="price" name="price" type="number" min={0} step={1} required className="input" placeholder="0 = free" />
        </div>
        <div>
          <label className="label" htmlFor="location">Pickup location</label>
          <input id="location" name="location" maxLength={100} className="input" placeholder="e.g. Hostel 4, Library gate" />
        </div>
        <div>
          <label className="label" htmlFor="category">Category</label>
          <select id="category" name="category" className="input" defaultValue="books">
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="condition">Condition</label>
          <select id="condition" name="condition" className="input" defaultValue="good">
            {CONDITIONS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="label" htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          rows={5}
          maxLength={2000}
          className="input"
          placeholder="How old is it? Any defects? Anything included (charger, box, notes)?"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="btn-primary w-full" disabled={busy}>
        {busy ? "Posting..." : "Post listing"}
      </button>
    </form>
  );
}
