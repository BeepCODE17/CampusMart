export type ListingStatus = "available" | "reserved" | "sold";

export interface Profile {
  id: string;
  full_name: string;
  hostel: string | null;
  phone: string | null;
}

export interface Listing {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  location: string | null;
  images: string[];
  status: ListingStatus;
  created_at: string;
  seller?: Pick<Profile, "full_name" | "hostel" | "phone"> | null;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}
