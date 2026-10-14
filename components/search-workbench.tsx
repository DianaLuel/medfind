"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, LocateFixed, Search, ShieldCheck } from "lucide-react";
import { PharmacyResultCard } from "@/components/pharmacy-result-card";
import { MEDICINE_FORMS, NEIGHBORHOODS } from "@/lib/constants";
import type { AvailabilityRecord, PublicSearchResponse } from "@/lib/types";

function distanceBetween(lat1: number, lng1: number, lat2: number | null, lng2: number | null): number | null {
  if (lat2 === null || lng2 === null || !Number.isFinite(lat2) || !Number.isFinite(lng2)) return null;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthKm = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;
  return earthKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function SearchWorkbench({ initialQuery, initialNeighborhood, initialConfigured }: { initialQuery: string; initialNeighborhood: string; initialConfigured: boolean }) {
  const [query, setQuery] = useState(initialQuery);
  const [neighborhood, setNeighborhood] = useState(initialNeighborhood);
  const [strength, setStrength] = useState("");
  const [form, setForm] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<"recent" | "distance">("recent");
  const [origin, setOrigin] = useState<{ lat: number; lng: number } | null>(null);
  const [locationState, setLocationState] = useState("");
  const [results, setResults] = useState<AvailabilityRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [error, setError] = useState("");
  const [loadedKey, setLoadedKey] = useState("");

  const trimmedQuery = query.trim();
  const requestKey = JSON.stringify([trimmedQuery, neighborhood, strength.trim(), form, page]);
  const currentResponse = loadedKey === requestKey;
  const currentResults = useMemo(() => currentResponse ? results : [], [currentResponse, results]);
  const currentTotal = currentResponse ? total : 0;
  const currentConfigured = currentResponse ? configured : null;
  const currentError = currentResponse ? error : "";
  const isLoading = Boolean(trimmedQuery) && (loading || !currentResponse);

  useEffect(() => {
    if (!trimmedQuery) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      const params = new URLSearchParams({ q: trimmedQuery, page: String(page) });
      if (neighborhood) params.set("neighborhood", neighborhood);
      if (strength.trim()) params.set("strength", strength.trim());
      if (form) params.set("form", form);
      try {
        const response = await fetch(`/api/search?${params.toString()}`, { signal: controller.signal, cache: "no-store" });
        const payload = (await response.json()) as PublicSearchResponse;
        if (!response.ok || payload.error) throw new Error(payload.error || "Search could not be completed.");
        setConfigured(payload.configured);
        setResults(payload.results ?? []);
        setTotal(payload.total ?? 0);
        setError("");
        setLoadedKey(requestKey);
      } catch (caught) {
        if (controller.signal.aborted) return;
        setConfigured(null);
        setResults([]);
        setTotal(0);
        setError(caught instanceof Error ? caught.message : "Search could not be completed.");
        setLoadedKey(requestKey);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 350);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [trimmedQuery, neighborhood, strength, form, page, requestKey]);

  const hasPharmacyCoordinates = currentResults.some((record) => record.pharmacy.latitude !== null && record.pharmacy.longitude !== null && Number.isFinite(record.pharmacy.latitude) && Number.isFinite(record.pharmacy.longitude));
  const sortedResults = useMemo(() => {
    if (!origin || sort !== "distance") return currentResults;
    return [...currentResults].sort((a, b) => {
      const dA = distanceBetween(origin.lat, origin.lng, a.pharmacy.latitude, a.pharmacy.longitude);
      const dB = distanceBetween(origin.lat, origin.lng, b.pharmacy.latitude, b.pharmacy.longitude);
      if (dA === null) return dB === null ? 0 : 1;
      if (dB === null) return -1;
      return dA - dB;
    });
  }, [currentResults, origin, sort]);

  function requestLocation() {
    if (!navigator.geolocation) { setLocationState("Location services are not available in this browser."); return; }
    setLocationState("Requesting your location…");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setOrigin({ lat: position.coords.latitude, lng: position.coords.longitude });
        if (hasPharmacyCoordinates) {
          setSort("distance");
          setLocationState("This page is sorted on your device using pharmacy coordinates. Your location is not sent to the directory or stored.");
        } else {
          setSort("recent");
          setLocationState("Your location stays on this device. These results do not have verified pharmacy coordinates, so distance sorting is unavailable.");
        }
      },
      () => setLocationState("Location was not shared. You can still search by neighborhood."),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 },
    );
  }

  const pages = Math.max(1, Math.ceil(currentTotal / 12));
  const displayRecords = sortedResults.map((record) => ({ record, distance: origin ? distanceBetween(origin.lat, origin.lng, record.pharmacy.latitude, record.pharmacy.longitude) : null }));

  return (
    <div>
      <div className="filter-row" aria-label="Medicine search filters">
        <label className="field"><span>Medicine or active ingredient</span><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="e.g. medicine name" maxLength={100} /></label>
        <label className="field"><span>Neighborhood</span><select value={neighborhood} onChange={(event) => { setNeighborhood(event.target.value); setPage(1); }}><option value="">All Addis Ababa</option>{NEIGHBORHOODS.map((area) => <option key={area} value={area}>{area}</option>)}</select></label>
        <label className="field"><span>Strength or dosage</span><input value={strength} onChange={(event) => { setStrength(event.target.value); setPage(1); }} placeholder="Optional" maxLength={60} /></label>
        <label className="field"><span>Medicine form</span><select value={form} onChange={(event) => { setForm(event.target.value); setPage(1); }}><option value="">Any form</option>{MEDICINE_FORMS.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
      </div>
      {!initialConfigured && currentConfigured === null && <div className="notice" style={{ marginTop: 14 }}><strong>Live search is not connected yet.</strong> No real pharmacy or stock is shown. See the <Link className="text-link" href="/setup">Supabase setup guide</Link> while the directory is being connected.</div>}
      <div className="results-toolbar"><span className="results-count" aria-live="polite">{isLoading ? "Searching…" : currentTotal ? `${currentTotal} result${currentTotal === 1 ? "" : "s"}` : trimmedQuery ? "No current results" : "Enter a medicine to search"}</span>
        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8 }}><button className="button button-secondary button-small" type="button" onClick={requestLocation}><LocateFixed size={14} aria-hidden="true" />Use my location</button><label className="field" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}><span className="sr-only">Sort results</span><select aria-label="Sort results" value={sort} onChange={(event) => setSort(event.target.value as "recent" | "distance")} disabled={!origin || !hasPharmacyCoordinates} style={{ minHeight: 38, padding: "6px 10px" }}><option value="recent">Most recently confirmed</option><option value="distance">Nearest first (this page)</option></select></label></div>
      </div>
      {locationState && <p className="search-note" aria-live="polite">{locationState}</p>}
      {currentError && <div className="notice" role="alert">{currentError}</div>}
      {currentConfigured === false && trimmedQuery && <div className="empty-state"><span className="empty-icon"><ShieldCheck size={22} aria-hidden="true" /></span><h2>Search is waiting for a pharmacy network</h2><p>Live search is not connected yet. No real pharmacy or stock has been invented. Once the service is connected to its pharmacy partners, genuine confirmations will appear here.</p><div className="card-actions" style={{ marginTop: 17 }}><Link className="button button-secondary button-small" href="/partners/apply">Pharmacy partners</Link><Link className="button button-quiet button-small" href="/setup">Operator setup guide</Link></div><aside className="demo-preview" aria-label="Demonstration record, not real availability"><span className="demo-label">DEMO DATA · EXAMPLE ONLY</span><strong>Example medicine</strong><span>Sample Pharmacy · display-only record</span><span className="demo-status">No stock claim</span><p>This is not a real pharmacy or availability record. It has no real address, phone number, or directions.</p></aside></div>}
      {currentConfigured !== false && !currentError && !isLoading && trimmedQuery && currentResults.length === 0 && <div className="empty-state"><span className="empty-icon"><Search size={22} aria-hidden="true" /></span><h2>No recent confirmations found</h2><p>Try a different medicine name or neighborhood. A missing result does not mean a medicine is unavailable—contact a pharmacy directly if you need help finding it.</p></div>}
      {isLoading && <div className="result-list" aria-label="Loading results" aria-busy="true"><div className="pharmacy-card loading-lines"><div className="skeleton" style={{ width: "44%" }} /><div className="skeleton" style={{ width: "72%" }} /><div className="skeleton" style={{ width: "56%" }} /></div><div className="pharmacy-card loading-lines"><div className="skeleton" style={{ width: "39%" }} /><div className="skeleton" style={{ width: "67%" }} /><div className="skeleton" style={{ width: "50%" }} /></div></div>}
      {!isLoading && currentResults.length > 0 && <div className="result-layout"><div className="result-list">{displayRecords.map(({ record, distance }) => <PharmacyResultCard key={record.id} record={record} distanceKm={distance} />)}{pages > 1 && <nav aria-label="Search result pages" className="card-actions" style={{ justifyContent: "space-between", paddingTop: 10 }}><button className="button button-secondary button-small" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}><ArrowLeft size={14} aria-hidden="true" />Previous</button><span className="results-count">Page {page} of {pages}</span><button className="button button-secondary button-small" disabled={page >= pages} onClick={() => setPage((current) => current + 1)}>Next<ArrowRight size={14} aria-hidden="true" /></button></nav>}</div><aside className="results-aside"><h3>Before making the trip</h3><p>Stock can change after a confirmation. Use the pharmacy’s phone number to reconfirm the medicine and opening hours.</p></aside></div>}
    </div>
  );
}
