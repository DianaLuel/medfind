import type { AvailabilityState } from "@/lib/types";

export type PublicAvailability = { kind: "in_stock" | "unavailable" | "unknown" | "stale"; label: string };

export function getPublicAvailability(status: AvailabilityState | string, expiresAt: string | null): PublicAvailability {
  const isExpired = !expiresAt || Number.isNaN(Date.parse(expiresAt)) || Date.parse(expiresAt) <= Date.now();
  if (isExpired) return { kind: "stale", label: "Availability needs reconfirmation" };
  if (status === "in_stock") return { kind: "in_stock", label: "Pharmacy confirmed in stock" };
  if (status === "unavailable") return { kind: "unavailable", label: "Pharmacy confirmed unavailable" };
  return { kind: "unknown", label: "Availability unknown" };
}

export function formatAddisTimestamp(value: string | null): string {
  if (!value) return "Confirmation time not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Confirmation time not recorded";
  return new Intl.DateTimeFormat("en-ET", { dateStyle: "medium", timeStyle: "medium", timeZone: "Africa/Addis_Ababa" }).format(date) + " (Addis Ababa time)";
}

export function sanitizePhone(value: string | null): string | null {
  if (!value) return null;
  const normalized = value.trim().replace(/[^+\d]/g, "");
  return normalized.length >= 7 && normalized.length <= 18 ? normalized : null;
}
