import { ArrowRight, MapPin, Search } from "lucide-react";
import { NEIGHBORHOODS } from "@/lib/constants";

export function SearchForm({ query = "", neighborhood = "" }: { query?: string; neighborhood?: string }) {
  return (
    <form action="/search" method="get" className="search-form" role="search">
      <label className="search-field-wrap"><Search size={18} aria-hidden="true" /><span className="sr-only">Medicine name or active ingredient</span><input name="q" defaultValue={query} placeholder="Medicine or active ingredient" autoComplete="off" /></label>
      <span className="search-divider" aria-hidden="true" />
      <label className="search-field-wrap"><MapPin size={17} aria-hidden="true" /><span className="sr-only">Neighborhood</span><select name="neighborhood" defaultValue={neighborhood}><option value="">All Addis Ababa</option>{NEIGHBORHOODS.map((area) => <option value={area} key={area}>{area}</option>)}</select></label>
      <button className="button button-primary" type="submit">Search <ArrowRight size={15} aria-hidden="true" /></button>
    </form>
  );
}
