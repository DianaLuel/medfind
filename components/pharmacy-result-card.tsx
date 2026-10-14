import Link from "next/link";
import { ArrowUpRight, BadgeCheck, Clock3, MapPin, Phone } from "lucide-react";
import { AvailabilityStatus } from "@/components/availability-status";
import { formatAddisTimestamp, sanitizePhone } from "@/lib/availability";
import type { AvailabilityRecord } from "@/lib/types";

export function PharmacyResultCard({ record, distanceKm }: { record: AvailabilityRecord; distanceKm?: number | null }) {
  const phone = sanitizePhone(record.pharmacy.phone);
  const directionsText = [record.pharmacy.name, record.pharmacy.address, record.pharmacy.neighborhood, "Addis Ababa"].filter(Boolean).join(", ");
  const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(directionsText)}`;
  const medicineLabel = [record.medicine.name, record.medicine.strength, record.medicine.form].filter(Boolean).join(" · ");

  return (
    <article className="pharmacy-card">
      <div className="pharmacy-card-top">
        <div>
          <h2><Link href={`/pharmacies/${encodeURIComponent(record.pharmacy.slug)}`}>{record.pharmacy.name}</Link></h2>
          <div className="pharmacy-meta">
            <span><MapPin size={13} aria-hidden="true" />{record.pharmacy.neighborhood ? `${record.pharmacy.neighborhood}, ` : ""}{record.pharmacy.address}</span>
            {record.pharmacy.is_verified && <span><BadgeCheck size={13} aria-hidden="true" />Business verified</span>}
            {distanceKm != null && <span>{distanceKm.toFixed(1)} km away</span>}
          </div>
        </div>
        <AvailabilityStatus status={record.status} expiresAt={record.expires_at} />
      </div>
      <div className="availability-details">
        <div>
          <div className="availability-medicine">{medicineLabel}</div>
          <div className="availability-time"><Clock3 size={12} style={{ display: "inline", marginRight: 4 }} aria-hidden="true" />{formatAddisTimestamp(record.last_confirmed_at)} · {record.source === "pharmacy_staff" ? "Confirmed by pharmacy staff" : "Source: unverified"}</div>
        </div>
      </div>
      <div className="card-actions">
        {phone ? <a className="button button-primary button-small" href={`tel:${phone}`}><Phone size={14} aria-hidden="true" />Call pharmacy</a> : <span className="button button-secondary button-small" aria-disabled="true">Phone not listed</span>}
        <a className="button button-secondary button-small" href={directionsUrl} target="_blank" rel="noreferrer"><MapPin size={14} aria-hidden="true" />Directions <ArrowUpRight size={13} aria-hidden="true" /></a>
        <Link className="button button-quiet button-small" href={`/pharmacies/${encodeURIComponent(record.pharmacy.slug)}`}>Pharmacy details</Link>
      </div>
    </article>
  );
}
