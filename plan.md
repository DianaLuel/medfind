# MedFind Ethiopia — Implementation Plan

## Approved scope and approach

Build the requested full-stack, responsive healthcare availability directory with Next.js App Router, TypeScript, Tailwind CSS, Framer Motion, and Supabase Auth/PostgreSQL. The app includes public home, medicine-search results, pharmacy details, partner application, privacy/safety/setup pages, a pharmacy staff dashboard, and an admin dashboard. Public search and listings remain empty until real Supabase credentials and genuine partner records are configured. Until then, a single UI-only record on the search page is labeled `DEMO DATA · EXAMPLE ONLY`; it has no real pharmacy, address, phone, location, or availability claim and is never returned as a live search result or seeded into the database.

No Supabase project URL/key is configured in this app environment. The application therefore includes real Supabase integration code, a PostgreSQL migration with RLS, and clear setup instructions, while explicitly distinguishing absent credentials from a connected service. Do not fabricate real partner names, testimonials, activity statistics, or stock claims.

## Implementation decisions

- Use a flexible Next.js project structure on the managed server runtime. Supabase remains the explicitly requested external PostgreSQL/Auth provider; do not enable or imply a different managed database.
- Use `@supabase/ssr` and `@supabase/supabase-js`. The `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` values are public browser configuration, not privileged credentials; the server reads them at request time and Next.js embeds them into the production client bundle at build time, so configure them before production builds. Do not commit project values. Normal access uses the anon key with RLS; never expose a service-role key in browser code and keep any future privileged key server-only.
- Implement RLS on every application table: public access only to approved pharmacy profiles and their availability records; pharmacy members can manage only their own pharmacy; only an admin reviews registrations, reports, accounts, and expiry policy. Public/partner reads exclude creator and confirmer UUID columns. Search terms and device coordinates are transient and are not recorded as visitor profiles or search history.
- Record pharmacy-staff source, acting user, `last_confirmed_at`, and `expires_at` automatically. Expiry is configurable from 1–720 hours (default 24); stale records are labeled “Availability needs reconfirmation” rather than shown as current stock. Database rules block inventory operations for unapproved pharmacies and block pharmacy profile/inventory changes and private inventory reads for suspended pharmacies.
- Provide genuine loading, success, empty, error, and unconfigured states. The demonstration record is visual-only, conspicuously marked as a demo, makes no stock claim, and has no actionable contact or directions.
- Provide call, directions, confirmation-source, and exact Addis Ababa timestamp details when real data exists. Remind users to reconfirm stock before travelling. Do not recommend prescription medicines, advise dosage, or substitute medicines.
- Validate inputs on server routes/forms, paginate and debounce search, avoid logging search terms, and enforce roles in both server-side page guards and database RLS.

## Project structure

- `app/`: App Router layouts/pages for `/`, `/search`, `/pharmacies/[slug]`, `/partners/apply`, `/staff`, `/staff/sign-in`, `/staff/inventory`, `/admin`, `/privacy`, `/safety`, and `/setup`; `app/api/search/route.ts` is a validated public search endpoint.
- `components/`: Reusable brand/header/footer, search controls, pharmacy/availability cards, partner/staff/admin forms and panels, scroll reveal, and freshness-aware status components.
- `lib/`: Shared types, neighborhood constants, availability freshness/formatting, and Supabase environment, browser, server, and auth helpers.
- `supabase/migrations/`: PostgreSQL schema, expiry and audit triggers, helper functions, column-scoped read grants, and RLS policies. No real partner or inventory rows are seeded.
- `public/`: Site favicon, platform-brand source artwork, and the static `/manus-routes.json` page-route manifest.
- Root files: `package.json`, `pnpm-lock.yaml`, lifecycle allowlist, `.env.example`, `README.md`, `SUPABASE_SETUP.md`, `app.config.ts`, `plan.md`, and `TODO.md`.

## Design system

- **Design Movement:** Contemporary editorial health-tech, grounded in the clarity of Ethiopian neighborhood wayfinding and the calm restraint of modern public-service design.
- **Core Principles:** Trust before conversion; legible freshness before attractive status; low-friction mobile actions; transparent unknowns instead of false certainty.
- **Color Philosophy:** Warm ivory keeps long search sessions comfortable; forest green is the ownable trust/action color; soft mint marks calm verified states without implying certainty beyond the data. Neutral ink and muted sage support secondary content. Warning amber and restrained red signal aging records and errors; status is never conveyed by color alone.
- **Layout Paradigm:** An editorial, left-anchored composition with a spacious asymmetric home hero, compact neighborhood/search controls, and vertically scannable result rows. Restrained two-column desktop treatments collapse to a single-column, thumb-friendly mobile flow.
- **Signature Elements:** A “last confirmed” time chip paired with its source; an original pin-and-leaf mark and wordmark; a thin route-line ornament that frames navigation without suggesting a verified map.
- **Interaction Philosophy:** Search is forgiving and debounced; filters are clear; calls and directions are one-tap actions; unknown, expired, unavailable, and confirmed statuses stay verbally distinct. Forms explain effects and return direct feedback.
- **Animation:** Restrained 160–240 ms hover/focus transitions, subtle entrance/page reveals, and no looping decorative motion. Respect `prefers-reduced-motion` by disabling entrance motion and reducing transitions to near-instant; never delay search.
- **Typography System:** DM Sans for UI and data; DM Serif Display for editorial headlines, with robust system fallbacks. Compact display headings pair with readable 16–18 px body copy and a consistent contrast hierarchy.
- **Brand Essence:** “A trustworthy way for Ethiopian communities to check medicine availability before a trip.” Personality: calm, clear, accountable.
- **Brand Voice:** Direct, reassuring, never clinical or absolute. Examples: “Find your medicine before you travel.” “Availability was confirmed at this time—please call before making the trip.”
- **Wordmark & Logo:** An original compact forest-green map pin enclosing a leaf/check mark, paired with the typographic “MedFind” wordmark and a small “ETHIOPIA” descriptor. The icon is an original scalable SVG; it does not imply affiliation with a pharmacy.
- **Signature Brand Color:** Forest green `#174B3A`.

## Build workflow and constraints

1. Preserve the approved requirements as independent outcomes in `TODO.md` before configuration and implementation.
2. Use the initialized TypeScript diagnostics registration before adding application code.
3. Implement the responsive UI, secure Supabase Auth/RLS integration, migrations, and setup instructions. Do not request or fabricate credentials.
4. Keep `public/manus-routes.json` synchronized with every user-facing route before starting the development server.
5. Use the pinned pnpm toolchain and reviewed lifecycle-script policy; resolve diagnostics and produce a production build.
6. Run Preview on the configured runtime port, verify the site and route manifest over HTTP, and fix confirmed issues. Keep actual partner data empty until real credentials and approved records exist.
7. Do not claim publication unless successful publication is confirmed; provide the current Preview if only a Preview/checkpoint is available.
