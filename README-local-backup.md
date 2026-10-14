# MedFind Ethiopia

A responsive medicine-availability directory for Ethiopian users, beginning with Addis Ababa. The app is built with Next.js App Router, TypeScript, Tailwind CSS, Framer Motion, and Supabase integration points.

## Run locally

1. Install the pinned package manager (`pnpm@11.25.0`) and run `pnpm install`.
2. Copy `.env.example` to `.env.local` and add the Supabase project URL and public anon key from your own project. Never commit project keys. For production, configure these browser-public values before the build and rebuild/redeploy after changing them.
3. Follow [Supabase setup](./SUPABASE_SETUP.md) to apply the SQL migration, enable Email Auth, and create authorized accounts.
4. Run `pnpm dev` and open `http://localhost:3000`.

Without Supabase settings, search and staff/admin operations clearly report that setup is incomplete. The search page shows one explicitly labeled, display-only `DEMO DATA · EXAMPLE ONLY` card; it is not a real pharmacy or availability record, is never returned by search, and has no actionable contact/location. No real pharmacies, live stock, testimonials, or usage statistics are included.

## Useful commands

- `pnpm typecheck` — TypeScript check
- `pnpm lint` — ESLint
- `pnpm build` — production build
