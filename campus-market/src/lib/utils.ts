import { CATEGORIES, CONDITIONS } from "./constants";

const currency = process.env.NEXT_PUBLIC_CURRENCY || "INR";
const priceFormat = new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
  style: "currency",
  currency,
  maximumFractionDigits: 0,
});

export function formatPrice(price: number) {
  return Number(price) === 0 ? "Free" : priceFormat.format(Number(price));
}

export function categoryLabel(value: string) {
  return CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export function conditionLabel(value: string) {
  return CONDITIONS.find((c) => c.value === value)?.label ?? value;
}

export function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  const units: [number, string][] = [
    [60 * 60 * 24 * 365, "y"],
    [60 * 60 * 24 * 30, "mo"],
    [60 * 60 * 24 * 7, "w"],
    [60 * 60 * 24, "d"],
    [60 * 60, "h"],
    [60, "m"],
  ];
  for (const [size, label] of units) {
    if (seconds >= size) return `${Math.floor(seconds / size)}${label} ago`;
  }
  return "just now";
}

/** Only allow same-site relative redirects, e.g. "/listings/123". */
export function safeNext(next: string | null | undefined) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

/** Path of a file inside the listing-images bucket, from its public URL. */
export function storagePathFromUrl(url: string) {
  const marker = "/listing-images/";
  const i = url.indexOf(marker);
  return i === -1 ? null : decodeURIComponent(url.slice(i + marker.length));
}
