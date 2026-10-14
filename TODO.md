# MedFind Ethiopia — Delivery Criteria

**Status note:** The app contains real Supabase Auth/PostgreSQL integration code and a migration, but no project URL/key is configured and the migration has not been applied to an external project. Features that require real authentication or data writes remain open below; the app reports this instead of simulating a live connection.

## Public discovery and medicine search
- [x] The home page has the hero headline “Find your medicine before you travel.”; supporting text explaining the service; a prominent medicine search bar; location or neighborhood selection; a How it works section; trust and availability explanation; participating pharmacy section; and a footer with contact, privacy, and safety information.
- [x] Medicine results support search by medicine name or active ingredient; filters for neighborhood, dosage, and medicine form; pharmacy name, address, contact information, and directions; availability status and exact last-confirmed timestamp; a button to call the pharmacy; clear labels when availability is unknown or stale; and sorting by distance when reliable location data is available. The results UI is implemented; genuine pharmacy results appear only after a real database is configured and populated.
- [x] The pharmacy details page shows pharmacy name and verified business status; address, opening hours, and contact details; medicine availability records with confirmation times; directions and call buttons. It shows an explicit no-listings/setup state rather than inventing a pharmacy when no data is configured.
- [x] Search includes debouncing and sensible pagination; phone numbers and directions are easy to use on mobile.
- [x] Do not fabricate real pharmacies, real-time stock, testimonials, or usage statistics. Do not claim stock without genuine confirmation. Any demonstration inventory is clearly labeled DEMO DATA and not presented as live availability. Use clearly labeled demonstration records until genuine pharmacy partners are onboarded; otherwise show a truthful empty state. The sole example is display-only and is not returned by the search API or stored in the database.

## Pharmacy staff dashboard and inventory controls
- [ ] Authorized pharmacy users can sign in; manage their pharmacy profile; search or add medicine catalog entries; update availability to in stock, unavailable, or unknown; record confirmation timestamps automatically; review recently updated inventory; see when an availability record has expired; and update information using a simple mobile-friendly interface. The Supabase Auth and staff workflows are implemented, but live sign-in and writes await real Supabase credentials and migration setup.
- [ ] Pharmacy staff cannot edit another pharmacy's inventory. The migration enforces pharmacy-specific RLS, but live enforcement awaits applying it to the connected project.
- [ ] Store the source of each availability confirmation and its timestamp. Expire availability confirmations after a configurable period. Show expired records as “Availability needs reconfirmation.” Distinguish pharmacy-confirmed availability from unverified information. The source, trigger, expiry, and labels are implemented in code/SQL; live timestamps await the migration.
- [x] Do not expose customer medical searches or sensitive personal information to pharmacy staff. Searches are transient, search terms are not logged by the app, application records are admin-only, and public/partner grants omit staff creator/confirmer UUID columns.

## Administrator controls
- [ ] Authorized administrators can review and approve pharmacy registrations; manage pharmacy accounts; review inaccurate availability reports; suspend accounts when necessary; monitor stale inventory records; and view basic operational metrics. The admin dashboard and RLS-backed actions are implemented; live operation awaits a configured Supabase project and administrator role.

## Safety, privacy, and truthful availability
- [x] The application is a medicine availability directory, not a medical advice service.
- [x] Never recommend prescription medicines, suggest dosage, or automatically substitute medicines.
- [x] Tell users to contact the pharmacy to reconfirm stock before travelling.
- [x] Include privacy and data retention considerations.
- [x] Include thoughtful empty states, loading skeletons, and error handling; include loading, empty, success, and failure states.

## Technology, security, and integration setup
- [x] Use Next.js App Router and TypeScript, Tailwind CSS, and Supabase PostgreSQL for persistent data and Supabase Auth for authentication. The project uses the requested stack and real integration code.
- [ ] Apply database Row Level Security to all protected data. Keep privileged credentials on the server. RLS and restricted read grants are present in the migration, but have not been applied to a real database; the app does not use a service-role key in the browser.
- [x] Validate all inputs and handle errors properly. Create database migrations or SQL setup instructions.
- [x] Connect the database and authentication where configured. If environment variables or credentials are missing, provide a clear setup guide rather than pretending the integration works. No variables are configured, and the in-app and Markdown setup instructions explain the required steps.
- [x] Keep the code organized into reusable components.

## Responsive design and accessibility
- [x] Use forest green, warm ivory, and soft mint colors; clean typography, generous whitespace, and beautiful pharmacy cards.
- [x] Include smooth Framer Motion animations, subtle page transitions, and scroll reveals without excessive animations.
- [x] Provide excellent responsive layouts for mobile, tablet, and desktop; accessible controls, readable text, and reduced-motion support.
- [x] Avoid generic template layouts, fake statistics, and unnecessary gradients.

## Final product quality
- [x] The final result looks like a professionally designed Ethiopian health-tech startup product, with a distinctive identity and a strong emphasis on trust.
