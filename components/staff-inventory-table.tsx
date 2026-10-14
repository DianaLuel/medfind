"use client";

import { useEffect, useState } from "react";

type InventoryRow = { id: string; status: string; last_confirmed_at: string | null; expires_at: string | null; medicine: { name: string; strength: string | null; form: string | null } | null };

function formatTime(value: string | null) {
  if (!value || Number.isNaN(Date.parse(value))) return "Not recorded";
  return new Intl.DateTimeFormat("en-ET", { dateStyle: "medium", timeStyle: "medium", timeZone: "Africa/Addis_Ababa" }).format(new Date(value));
}

export function StaffInventoryTable({ inventory }: { inventory: InventoryRow[] }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const timer = window.setTimeout(() => setNow(Date.now()), 0);
    const interval = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => { window.clearTimeout(timer); window.clearInterval(interval); };
  }, []);

  return (
    <div className="table-wrap"><table><thead><tr><th>Medicine</th><th>Status</th><th>Last confirmed</th></tr></thead><tbody>{inventory.map((record) => {
      const isFresh = now !== null && Boolean(record.expires_at) && Date.parse(record.expires_at as string) > now;
      const status = now === null ? "Checking expiry…" : isFresh ? record.status.replaceAll("_", " ") : "Needs reconfirmation";
      return <tr key={record.id}><td>{record.medicine?.name ?? "Catalog entry"}{record.medicine?.strength ? ` · ${record.medicine.strength}` : ""}{record.medicine?.form ? ` · ${record.medicine.form}` : ""}</td><td>{status}</td><td>{formatTime(record.last_confirmed_at)}</td></tr>;
    })}</tbody></table></div>
  );
}
