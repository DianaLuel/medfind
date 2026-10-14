import type { Metadata } from "next";
import { SearchWorkbench } from "@/components/search-workbench";
import { hasSupabaseConfig } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Search medicines" };

type SearchParams = { q?: string | string[]; neighborhood?: string | string[] };

export default async function SearchPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const query = Array.isArray(params.q) ? params.q[0] : params.q ?? "";
  const neighborhood = Array.isArray(params.neighborhood) ? params.neighborhood[0] : params.neighborhood ?? "";
  const configured = hasSupabaseConfig();
  return (
    <main>
      <section className="shell page-heading">
        <p className="section-kicker">Medicine directory · Addis Ababa</p>
        <h1>Search recent confirmations.</h1>
        <p>Look for a medicine by its name or active ingredient. Each result shows when availability was last confirmed.</p>
      </section>
      <section className="shell content-section">
        <SearchWorkbench initialQuery={query} initialNeighborhood={neighborhood} initialConfigured={configured} />
      </section>
    </main>
  );
}
