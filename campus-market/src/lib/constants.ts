import type { ListingStatus } from "./types";

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "CampusMart";

export const CATEGORIES = [
  { value: "books", label: "Books & Notes" },
  { value: "electronics", label: "Electronics" },
  { value: "appliances", label: "Appliances" },
  { value: "furniture", label: "Furniture" },
  { value: "cycles", label: "Cycles & Vehicles" },
  { value: "lab", label: "Lab & Stationery" },
  { value: "sports", label: "Sports & Fitness" },
  { value: "clothing", label: "Clothing" },
  { value: "hostel", label: "Hostel Essentials" },
  { value: "other", label: "Other" },
] as const;

export const CONDITIONS = [
  { value: "new", label: "New" },
  { value: "like_new", label: "Like new" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "for_parts", label: "For parts" },
] as const;

export const STATUSES: ListingStatus[] = ["available", "reserved", "sold"];

export const MAX_IMAGES = 5;

export const ALLOWED_EMAIL_DOMAINS = (process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS || "")
  .split(",")
  .map((d) => d.trim().toLowerCase())
  .filter(Boolean);
