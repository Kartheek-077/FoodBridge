import type { Donation, DonationStatus, FoodType, OrgType } from "./types";

export const ORG_TYPE_LABELS: Record<OrgType, string> = {
  restaurant: "Restaurant",
  hotel: "Hotel",
  marriage_hall: "Marriage hall",
  hostel: "Hostel",
  event_organizer: "Event organizer",
};

export const FOOD_TYPE_LABELS: Record<FoodType, string> = {
  veg: "Veg",
  "non-veg": "Non-veg",
  both: "Veg & non-veg",
};

export const STATUS_LABELS: Record<DonationStatus, string> = {
  available: "Available",
  claimed: "Claimed",
  collected: "Collected",
  expired: "Expired",
  cancelled: "Cancelled",
};

/** A donation counts as "expiring soon" when it expires within this many hours. */
export const EXPIRING_SOON_HOURS = 6;

export function isExpiringSoon(expiresAt: string, now = Date.now()): boolean {
  const diff = new Date(expiresAt).getTime() - now;
  return diff > 0 && diff <= EXPIRING_SOON_HOURS * 3600_000;
}

export function formatTimeLeft(expiresAt: string, now = Date.now()): string {
  const diff = new Date(expiresAt).getTime() - now;
  if (diff <= 0) return "Expired";
  const totalMin = Math.floor(diff / 60_000);
  const days = Math.floor(totalMin / 1440);
  const hours = Math.floor((totalMin % 1440) / 60);
  const mins = totalMin % 60;
  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${mins}m left`;
  const secs = Math.floor((diff % 60_000) / 1000);
  return `${mins}m ${secs.toString().padStart(2, "0")}s left`;
}

export type StepState = "done" | "current" | "upcoming" | "stopped";

export interface TrackingStep {
  key: "posted" | "claimed" | "pickup_scheduled" | "collected" | "expired" | "cancelled";
  label: string;
  state: StepState;
  at?: string | null;
  description?: string;
}

/**
 * Builds the tracking timeline: Posted → Claimed → Pickup Scheduled → Collected.
 * Expired / Cancelled replace the remaining steps with a terminal stop.
 */
export function computeTrackingSteps(d: Donation): TrackingStep[] {
  const claimed = !!d.claim;
  const scheduled = !!d.claim?.pickupTime;
  const collected = d.status === "collected";

  const base: TrackingStep[] = [
    { key: "posted", label: "Posted", state: "done", at: d.createdAt, description: `By ${d.donor.name}` },
    {
      key: "claimed",
      label: "Claimed",
      state: claimed ? "done" : "upcoming",
      at: d.claim?.claimedAt,
      description: d.claim ? `By ${d.claim.ngoName}` : "Waiting for a verified NGO",
    },
    {
      key: "pickup_scheduled",
      label: "Pickup scheduled",
      state: scheduled ? "done" : "upcoming",
      at: d.claim?.pickupTime,
      description: scheduled ? "Pickup time confirmed" : "NGO picks a pickup time",
    },
    {
      key: "collected",
      label: "Collected",
      state: collected ? "done" : "upcoming",
      at: d.collectedAt,
      description: collected ? "Food reached people in need" : "Handed over to the NGO",
    },
  ];

  if (d.status === "expired" || d.status === "cancelled") {
    const kept = base.filter((s) => s.state === "done");
    kept.push({
      key: d.status,
      label: d.status === "expired" ? "Expired" : "Cancelled",
      state: "stopped",
      at: d.status === "expired" ? d.expiredAt ?? d.expiresAt : d.cancelledAt,
      description:
        d.status === "expired"
          ? "Expired before it was collected"
          : d.cancelReason || "Cancelled by the donor",
    });
    return kept;
  }

  const firstUpcoming = base.findIndex((s) => s.state === "upcoming");
  if (firstUpcoming >= 0) base[firstUpcoming].state = "current";
  return base;
}

/** Converts an ISO string to the value format of <input type="datetime-local">. */
export function toLocalInput(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromLocalInput(value: string): string {
  return new Date(value).toISOString();
}
