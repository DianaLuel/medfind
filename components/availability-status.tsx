import { getPublicAvailability } from "@/lib/availability";
import type { AvailabilityState } from "@/lib/types";

export function AvailabilityStatus({ status, expiresAt }: { status: AvailabilityState | string; expiresAt: string | null }) {
  const state = getPublicAvailability(status, expiresAt);
  const className = state.kind === "in_stock" ? "status-in-stock" : state.kind === "unavailable" ? "status-unavailable" : state.kind === "stale" ? "status-stale" : "status-unknown";
  return <span className={`status-pill ${className}`}><span className="status-dot" aria-hidden="true" />{state.label}</span>;
}
