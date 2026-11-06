import { format } from "date-fns";
import { Check, CircleDot, Clock, PackageCheck, Truck, Utensils, X, HandHeart } from "lucide-react";
import { computeTrackingSteps, type TrackingStep } from "@/lib/donation-utils";
import type { Donation } from "@/lib/types";
import { cn } from "@/lib/utils";

const ICONS: Record<TrackingStep["key"], typeof Check> = {
  posted: Utensils,
  claimed: HandHeart,
  pickup_scheduled: Truck,
  collected: PackageCheck,
  expired: Clock,
  cancelled: X,
};

/** Visual tracking stepper: Posted → Claimed → Pickup scheduled → Collected (or Expired/Cancelled). */
export function StatusTimeline({ donation, orientation = "auto" }: { donation: Donation; orientation?: "auto" | "vertical" }) {
  const steps = computeTrackingSteps(donation);
  const horizontal = orientation === "auto";

  return (
    <ol className={cn("relative flex flex-col gap-0", horizontal && "md:flex-row md:gap-2")}>
      {steps.map((step, i) => {
        const Icon = step.state === "done" ? Check : step.state === "current" ? CircleDot : ICONS[step.key];
        const last = i === steps.length - 1;
        return (
          <li key={step.key} className={cn("relative flex gap-4 pb-6", horizontal && "md:flex-1 md:flex-col md:gap-3 md:pb-0")}>
            {!last && (
              <span
                aria-hidden
                className={cn(
                  "absolute left-[1.15rem] top-10 h-[calc(100%-2.5rem)] w-0.5",
                  horizontal && "md:left-12 md:top-[1.15rem] md:h-0.5 md:w-[calc(100%-3.5rem)]",
                  step.state === "done" ? "bg-primary" : "bg-border",
                )}
              />
            )}
            <span
              className={cn(
                "relative z-10 grid size-10 shrink-0 place-items-center rounded-full border-2 transition-colors",
                step.state === "done" && "border-primary bg-primary text-primary-foreground",
                step.state === "current" && "border-warm bg-warm-soft text-warm",
                step.state === "upcoming" && "border-border bg-card text-muted-foreground",
                step.state === "stopped" && "border-destructive bg-destructive-soft text-destructive",
              )}
            >
              <Icon className="size-4" />
            </span>
            <div className="min-w-0 pt-1 md:pt-0">
              <p
                className={cn(
                  "font-semibold",
                  step.state === "upcoming" && "text-muted-foreground",
                  step.state === "stopped" && "text-destructive",
                )}
              >
                {step.label}
              </p>
              {step.at && step.state !== "upcoming" && step.state !== "current" && (
                <p className="text-xs font-medium text-foreground/70">{format(new Date(step.at), "d MMM, h:mm a")}</p>
              )}
              {step.description && <p className="mt-0.5 text-xs text-muted-foreground">{step.description}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
