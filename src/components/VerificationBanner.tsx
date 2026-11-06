import { Link } from "@tanstack/react-router";
import { Clock, ShieldAlert } from "lucide-react";
import type { User } from "@/lib/types";

/** Explains why an unverified NGO can browse but not claim. */
export function VerificationBanner({ user }: { user: User }) {
  if (user.role !== "ngo" || user.verificationStatus === "verified") return null;
  const rejected = user.verificationStatus === "rejected";
  return (
    <div
      className={`mb-6 flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center ${
        rejected ? "border-destructive/30 bg-destructive-soft" : "border-warning/30 bg-warning-soft"
      }`}
    >
      <span className={`grid size-10 shrink-0 place-items-center rounded-xl bg-card ${rejected ? "text-destructive" : "text-warning"}`}>
        {rejected ? <ShieldAlert className="size-5" /> : <Clock className="size-5" />}
      </span>
      <div className="flex-1 text-sm">
        <p className="font-semibold text-foreground">
          {rejected ? "Your verification was not approved" : "Your NGO is awaiting verification"}
        </p>
        <p className="text-muted-foreground">
          {rejected
            ? `Reason: ${user.rejectionReason ?? "Not specified"}. Update your details and contact support to resubmit.`
            : "You can browse donations, but only verified NGOs can claim them. We usually review documents within 24 hours."}
        </p>
      </div>
      <Link to="/pending-verification" className="text-sm font-semibold text-primary underline-offset-4 hover:underline">
        View status
      </Link>
    </div>
  );
}
