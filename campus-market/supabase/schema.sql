-- CampusMart database schema.
-- Run this whole file once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run.

-- ---------------------------------------------------------------------------
-- Allowed college email domains (only these can sign up)
-- ---------------------------------------------------------------------------
create table if not exists public.allowed_email_domains (
  domain text primary key
);
alter table public.allowed_email_domains enable row level security;
-- No policies: only the database itself (and the service role) can read this table.

-- EDIT THIS: replace with your college's email domain(s).
insert into public.allowed_email_domains (domain) values ('yourcollege.edu')
  on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Profiles (one per signed-up student)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '' check (char_length(full_name) <= 80),
  hostel text check (char_length(hostel) <= 80),
  phone text check (char_length(phone) <= 20),
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "Students can view profiles"
  on public.profiles for select to authenticated using (true);
create policy "Students can update their own profile"
  on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- Block sign-ups from other domains and create a profile for new users.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  email_domain text := lower(split_part(new.email, '@', 2));
begin
  if exists (select 1 from public.allowed_email_domains)
     and not exists (select 1 from public.allowed_email_domains where lower(domain) = email_domain) then
    raise exception 'Email domain % is not allowed', email_domain;
  end if;

  insert into public.profiles (id, full_name)
  values (new.id, split_part(new.email, '@', 1));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Listings
-- ---------------------------------------------------------------------------
create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 3 and 100),
  description text not null default '' check (char_length(description) <= 2000),
  price numeric(10, 2) not null check (price >= 0),
  category text not null,
  condition text not null,
  location text check (char_length(location) <= 100),
  images text[] not null default '{}',
  status text not null default 'available' check (status in ('available', 'reserved', 'sold')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search tsvector generated always as (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))
  ) stored
);
create index if not exists listings_search_idx on public.listings using gin (search);
create index if not exists listings_status_created_idx on public.listings (status, created_at desc);
create index if not exists listings_seller_idx on public.listings (seller_id);

alter table public.listings enable row level security;

create policy "Students can view listings"
  on public.listings for select to authenticated using (true);
create policy "Students can create their own listings"
  on public.listings for insert to authenticated with check (seller_id = auth.uid());
create policy "Sellers can update their listings"
  on public.listings for update to authenticated
  using (seller_id = auth.uid()) with check (seller_id = auth.uid());
create policy "Sellers can delete their listings"
  on public.listings for delete to authenticated using (seller_id = auth.uid());

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists listings_touch on public.listings;
create trigger listings_touch before update on public.listings
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Conversations (one per buyer per listing) and messages
-- ---------------------------------------------------------------------------
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  buyer_id uuid not null references public.profiles (id) on delete cascade,
  seller_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  unique (listing_id, buyer_id),
  check (buyer_id <> seller_id)
);
create index if not exists conversations_buyer_idx on public.conversations (buyer_id, last_message_at desc);
create index if not exists conversations_seller_idx on public.conversations (seller_id, last_message_at desc);

alter table public.conversations enable row level security;

create policy "Participants can view conversations"
  on public.conversations for select to authenticated
  using (auth.uid() in (buyer_id, seller_id));
create policy "Buyers can start conversations"
  on public.conversations for insert to authenticated
  with check (
    buyer_id = auth.uid()
    and seller_id = (select l.seller_id from public.listings l where l.id = listing_id)
  );

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists messages_conversation_idx on public.messages (conversation_id, created_at);

alter table public.messages enable row level security;

create policy "Participants can read messages"
  on public.messages for select to authenticated
  using (exists (
    select 1 from public.conversations c
    where c.id = conversation_id and auth.uid() in (c.buyer_id, c.seller_id)
  ));
create policy "Participants can send messages"
  on public.messages for insert to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id and auth.uid() in (c.buyer_id, c.seller_id)
    )
  );

create or replace function public.bump_conversation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.conversations set last_message_at = new.created_at where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists messages_bump on public.messages;
create trigger messages_bump after insert on public.messages
  for each row execute function public.bump_conversation();

-- Live chat updates
alter publication supabase_realtime add table public.messages;

-- ---------------------------------------------------------------------------
-- Image storage: public bucket, each user writes only to their own folder
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('listing-images', 'listing-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "Students upload to their own folder"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'listing-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Students delete their own images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'listing-images' and (storage.foldername(name))[1] = auth.uid()::text);
