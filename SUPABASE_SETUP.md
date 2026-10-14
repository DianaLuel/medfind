# Supabase setup — MedFind Ethiopia

**Live Supabase integration is not configured in the current app environment.** The application will not claim live authentication, persistence, pharmacy partners, or stock until a Supabase project is configured and the migration below has been applied.

## 1. Create a Supabase project

Create a project in your organization. From **Project Settings → API**, copy its project URL and public anon/publishable key. Keep secret/service-role keys private; normal requests use Supabase Auth and database RLS, so the app does not need a service-role key in browser code or for routine access.

For local development, copy `.env.example` to `.env.local` and set:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_KEY
```

Restart the Next.js server after changing environment values. Do not commit `.env.local` or paste keys into chat.

## 2. Apply the database schema

In **Supabase → SQL Editor**, run `supabase/migrations/202610130001_medfind.sql`. It creates the directory, pharmacy applications, memberships, medicine catalog, availability records, configurable expiry, issue reports, helper functions, column-level grants, and Row Level Security policies. It deliberately seeds no pharmacy or medicine-inventory records.

RLS limits public pharmacy and availability rows to approved, unsuspended pharmacies; inventory writes also require an approved, unsuspended pharmacy. Staff can modify only their own pharmacy profile, and cannot read or edit that pharmacy's private inventory while it is suspended. Admin-only tables and actions are protected by role checks. Public/partner grants intentionally omit staff creator/confirmer UUID columns from catalog and inventory reads.

The availability trigger records the authenticated pharmacy staff user, source, current timestamp, and expiry on each update. Initial expiry is 24 hours; admins can configure a value from 1 to 720 hours. Expired records remain visibly stale and must not be described as available.

## 3. Configure Supabase Auth and authorized accounts

In **Authentication → Providers**, enable Email. Turn off public end-user sign-up if your organization does not intend to accept unsolicited user accounts; pharmacy applications are separate business-review records. Invite/create staff users in Supabase Auth, then assign them to one pharmacy in `public.pharmacy_members` after the pharmacy is approved. Use the `owner`, `manager`, or `staff` role. RLS blocks a member from changing another pharmacy's profile or inventory, blocks inventory writes while a pharmacy is pending, and disables profile and private-inventory access while a pharmacy is suspended.

To bootstrap the first admin, create that person's Auth user, then run the commented SQL at the end of the migration with the real administrator email. Do this in Supabase SQL Editor as the project owner; do not expose an admin/service-role key to the web application. Admin role rows are protected by RLS.

## 4. Configure the website environment

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the web application's environment. These values are intentionally browser-visible public configuration and are protected by RLS, not secrets. In production, Next.js embeds `NEXT_PUBLIC_*` values into the browser bundle at build time: configure them before building/rebuilding the app and then redeploy. For local development, set them before restarting `pnpm dev`. Never set a service-role key as a `NEXT_PUBLIC_*` variable.

After restarting the app, verify search returns an honest empty state before partners are approved. Submit a pharmacy application, review it from the administrator dashboard, and link a staff Auth user to the new pharmacy. Only genuine pharmacy confirmations should be entered. Medicine searches are queried transiently and are not saved by this application; optional device location is used locally for sorting and is not sent to the directory.

## 5. Go-live considerations

- Review RLS, column-level grants, Auth email/password recovery, and invitation settings.
- Confirm at least one administrator and test separate staff accounts for two pharmacies; verify that each can alter only its own active pharmacy's inventory.
- Confirm public queries cannot see pending applications, staff memberships, customer-search history, or staff actor/creator UUID columns.
- Set availability expiry and publish a privacy/retention process before onboarding customers.
- Use genuine, reviewed pharmacy profiles and stock confirmations. The preview's `DEMO DATA` card is a display-only example, not a database record, pharmacy, or stock claim.
- Ask users to call a pharmacy before travelling. MedFind is not a medical advice service.
