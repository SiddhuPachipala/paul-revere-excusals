# Paul Revere Battalion Excusal Portal

Next.js + Supabase portal for cadet excusal requests and staff review.

## What is included

- Email/password authentication
- Cadet dashboard of upcoming events
- Excusal request form
- Cadet request-status page
- Staff dashboard
- Staff event creation
- Approve / deny / request-changes workflow
- Snapshot of approved memo data
- Printable Army-style excusal memorandum
- Supabase SSR cookie auth with Next.js `proxy.ts`

## 1. Get your Supabase credentials

In Supabase, open **Project Settings → API** (or the project's Connect dialog) and copy:

- Project URL
- Publishable key

Do **not** put a service-role/secret key in this app.

## 2. Configure environment variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Then paste your real values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
NEXT_PUBLIC_SITE_URL=https://YOUR_DEPLOYED_DOMAIN
```

For email verification, add both the production callback
`https://YOUR_DEPLOYED_DOMAIN/auth/confirm` and the local callback
`http://127.0.0.1:3000/auth/confirm` to **Authentication → URL Configuration →
Redirect URLs** in the Supabase dashboard. Set **Site URL** to the production
domain as well.

## 3. Install and run

```bash
npm install
npm run dev
```

Open http://localhost:3000

## 4. Database expectation

This app assumes the four tables already created in Supabase:

- `profiles`
- `events`
- `excusal_requests`
- `excusal_comments`

It also assumes the RLS policies and `is_staff()` function from the setup SQL have been created.

The signup profile trigger is included again at `supabase/migrations/001_profile_trigger.sql` for reference.

## 5. Make yourself admin

After signing up, change your `profiles.role` value in Supabase Table Editor to `admin`.

## Important production follow-ups

Before real battalion use:

1. Restrict signup to authorized domains/users.
2. Add profile editing or a staff-managed cadet roster so phone/company/MS instructor/commander/position are complete.
3. Confirm the exact memorandum routing/signature conventions with battalion staff.
4. Configure a production SMTP provider for reliable auth emails.
5. Add event editing/archiving and audit logging.

## Supabase security settings

After applying the database migrations, open **Authentication → Settings → Password Security** in Supabase and enable leaked-password protection. This hosted-project setting cannot be enabled by an application migration and requires the Pro plan or above.
