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
5. Go to **Authentication → Email Templates**. In both the **Magic Link** and **Confirm signup** templates, add the code, for example `Your code is {{ .Token }}`. Then students can type the code even if they open the email on their phone.

### 3. Configure and run

```bash
cd campus-market
cp .env.example .env.local      # then fill in the values
npm install
npm run dev
```

Fill `.env.local` with the **Project URL** and **anon public key** from Supabase (**Project Settings → API**), and your email domain. Then open http://localhost:3000.

## Deploy (free)

1. Push this folder to a GitHub repository.
2. Go to https://vercel.com, then **Add New → Project**, and import the repository.
3. Add the same environment variables as in `.env.local`.
4. After the first deploy, add your Vercel URL to the Supabase **Site URL** and **Redirect URLs**.

## Before launching on campus

- **Email sending limits:** Supabase's built-in email sender only allows a few emails per hour. Before inviting students, set up custom SMTP under **Authentication → SMTP Settings**. Resend, Brevo and Amazon SES all have free tiers.
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
