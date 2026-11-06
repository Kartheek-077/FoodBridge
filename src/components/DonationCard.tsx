import { Link } from "@tanstack/react-router";
import { MapPin, Navigation, Scale, Users } from "lucide-react";
import { format } from "date-fns";
import type { Donation } from "@/lib/types";
import { FOOD_TYPE_LABELS, ORG_TYPE_LABELS } from "@/lib/donation-utils";
import { Countdown } from "./Countdown";
import { StatusBadge } from "./StatusBadge";
import { FoodImage } from "./FoodImage";

export function FoodTypeDot({ type }: { type: Donation["foodType"] }) {
  const cls = type === "veg" ? "border-success text-success" : type === "non-veg" ? "border-destructive text-destructive" : "border-warm text-warm";
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
      <span className={`grid size-3.5 place-items-center rounded-[3px] border-2 ${cls}`}>
        <span className="size-1.5 rounded-full bg-current" />
      </span>
      {FOOD_TYPE_LABELS[type]}
    </span>
  );
}

export function DonationCard({ donation }: { donation: Donation }) {
  const d = donation;
  return (
    <Link
      to="/donations/$id"
      params={{ id: d.id }}
      className="group flex flex-col overflow-hidden rounded-2xl border bg-card shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <FoodImage src={d.imageUrl} alt={d.title} className="transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute left-3 top-3 flex gap-2">
          <Countdown expiresAt={d.expiresAt} className="bg-card/95 shadow-soft backdrop-blur" />
        </div>
        {d.status !== "available" && (
          <div className="absolute right-3 top-3">
            <StatusBadge status={d.status} />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center justify-between gap-2">
          <FoodTypeDot type={d.foodType} />
          {d.donor.organizationType && (
            <span className="text-xs font-medium text-muted-foreground">{ORG_TYPE_LABELS[d.donor.organizationType]}</span>
          )}
        </div>
        <div>
          <h3 className="line-clamp-1 font-sans text-lg font-bold tracking-tight">{d.title}</h3>
          <p className="text-sm text-muted-foreground">{d.donor.name}</p>
        </div>
        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <span className="inline-flex items-center gap-1.5 font-semibold text-primary-deep">
            {d.unit === "kg" ? <Scale className="size-4" /> : <Users className="size-4" />}
            {d.quantity} {d.unit}
          </span>
          <span className="inline-flex min-w-0 items-center gap-1.5 text-muted-foreground">
            <MapPin className="size-4 shrink-0" />
            <span className="truncate">{d.pickupAddress.split(",").slice(-2, -1)[0]?.trim() || d.pickupAddress}</span>
          </span>
          {d.distanceKm != null && (
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <Navigation className="size-3.5" /> {d.distanceKm} km
            </span>
          )}
        </div>
        <p className="border-t pt-3 text-xs text-muted-foreground">
          Pickup {format(new Date(d.pickupWindowStart), "h:mm a")} – {format(new Date(d.pickupWindowEnd), "h:mm a, d MMM")}
        </p>
      </div>
    </Link>
  );
}
