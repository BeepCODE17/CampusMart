# CampusMart

A marketplace for students on one campus to buy and sell second-hand books, electronics, appliances, cycles and more.

**Stack:** Next.js 15 (App Router, TypeScript, Tailwind CSS v4) + Supabase (auth, Postgres, storage, realtime). Everything fits in the free tiers of Supabase and Vercel.

## Features

- **College-only sign-in:** passwordless email link or 6-digit code, restricted to your college's email domain (enforced in the database, not just the UI).
- **Listings:** up to 5 photos (resized in the browser before upload), price (0 = free), category, condition, pickup spot, description.
- **Browse:** full-text search, category filters, sort by newest or price, pagination.
- **Chat:** a "Message seller" button opens a private, live-updating conversation per buyer per listing.
- **Seller tools:** mark an item available, reserved or sold, or delete it (its photos are deleted too).
- **Profile:** name, hostel, optional phone number.
- **Security:** Postgres Row Level Security on every table. Students can only edit their own listings, read their own chats, and upload to their own photo folder.

## Project layout

```
supabase/schema.sql          Tables, RLS policies, triggers, storage bucket (run once)
src/middleware.ts            Keeps the session fresh; sends signed-out users to /login
src/lib/                     Supabase clients, constants (categories, conditions), helpers
src/app/page.tsx             Browse + search
src/app/listings/new/        Sell form (photo upload)
src/app/listings/[id]/       Listing page, gallery, seller actions
src/app/messages/            Inbox and live chat
src/app/my/, profile/        My listings, profile
src/app/actions.ts           Server actions (profile, status, delete, start chat)
src/app/login/, auth/        Sign-in, magic-link callback, sign-out
```

## Setup

### 1. Install Node.js

Install the **LTS** version from https://nodejs.org (or run `winget install OpenJS.NodeJS.LTS` on Windows), then reopen your terminal.

### 2. Create a Supabase project

1. Sign up at https://supabase.com and create a new project.
2. `supabase/schema.sql` only allows sign-ups from `pilani.bits-pilani.ac.in` email addresses. To allow other domains too, add more `insert` lines.
3. In the Supabase dashboard, go to **SQL Editor**, then **New query**. Paste the whole file and click **Run**.
4. Go to **Authentication → URL Configuration**:
   - **Site URL:** `http://localhost:3000` for now, and your real domain after you deploy.
   - **Redirect URLs:** add `http://localhost:3000/auth/callback` and later `https://your-domain/auth/callback`.
5. Set up email sending through Brevo. Supabase's built-in sender only emails your Supabase team members, and only a few times an hour.
   1. In Brevo, verify a sender address under **Senders, Domains & Dedicated IPs → Senders**.
   2. Under **SMTP & API → SMTP**, generate an **SMTP key** (it starts with `xsmtpsib-`, not `xkeysib-`).
   3. In Supabase, go to **Authentication → Emails → SMTP Settings** and enable custom SMTP:

      | Field | Value |
      | --- | --- |
      | Sender email | The sender address you verified in Brevo |
      | Sender name | CampusMart |
      | Host | `smtp-relay.brevo.com` |
      | Port | `587` |
      | Username | The Brevo SMTP **Login**, like `8a1b2c001@smtp-brevo.com`. **Not your email address.** |
      | Password | The SMTP key |

   4. Under **Authentication → Rate Limits**, raise the email limit to about 30 per hour.
   5. "Error sending magic link email" on the sign-in page means Brevo rejected the login. Check **Logs → Auth** in Supabase for the reason.
6. Go to **Authentication → Emails → Templates**. These can only be edited after custom SMTP is set up. In both the **Magic Link** and **Confirm signup** templates, add `<p>Or enter this code on the sign-in page: <strong>{{ .Token }}</strong></p>`. Then students can type the code even if they open the email on their phone.

### 3. Configure and run

```bash
cd campus-market
cp .env.example .env.local      # then fill in the values
npm install
npm run dev
```

Fill `.env.local` with values from Supabase **Project Settings**:
- `NEXT_PUBLIC_SUPABASE_URL`: the **Project URL** from **Data API**, like `https://abcdefgh.supabase.co`. Leave off any `/rest/v1/` ending.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: the **Publishable key** (`sb_publishable_...`) from **API Keys**, or the legacy **anon** key. Never use the secret / service_role key.

Then open http://localhost:3000.

## Deploy (free)

1. Go to https://vercel.com, then **Add New → Project**, and import the `BeepCODE17/CampusMart` GitHub repository.
2. Set **Root Directory** to `campus-market`, because the app lives in that subfolder.
3. Add the same environment variables as in `.env.local`.
4. After the first deploy, add your Vercel URL to the Supabase **Site URL** and **Redirect URLs**.

## Before launching on campus

- **College mail filters:** some college mail servers quarantine sign-in emails. Test with a few accounts first.
- **Rules page:** add community rules, such as no prohibited items and meeting in public spots.

## Ideas for next versions

- Edit a listing after posting it
- Report listings or users, plus a simple admin view
- Unread-message badges and email notifications for new messages
- Wishlist / saved searches ("tell me when a used cycle is posted")
- "Wanted" posts, for students looking for an item
- Seller ratings after a sale
- Installable mobile app (PWA)
