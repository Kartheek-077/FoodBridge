import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { format } from "date-fns";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  HandHeart,
  Lock,
  MapPin,
  Navigation,
  Pencil,
  Phone,
  Scale,
  StickyNote,
  Store,
  Users,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageSkeleton } from "@/components/Skeletons";
import { ErrorState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { StatusTimeline } from "@/components/StatusTimeline";
import { Countdown } from "@/components/Countdown";
import { FoodImage } from "@/components/FoodImage";
import { FoodTypeDot } from "@/components/DonationCard";
import { ClaimDialog } from "@/components/ClaimDialog";
import { CancelDonationDialog } from "@/components/CancelDonationDialog";
import { donationQueries, useUpdateDonationStatus } from "@/hooks/use-donations";
import { useAuth } from "@/context/AuthContext";
import { getErrorMessage } from "@/lib/api";
import { ORG_TYPE_LABELS } from "@/lib/donation-utils";
import type { Donation, User } from "@/lib/types";

export const Route = createFileRoute("/donations/$id")({
  head: () => ({
    meta: [
      { title: "Donation details — FoodBridge" },
      { name: "description", content: "Details, pickup window and live status of a FoodBridge food donation." },
      { property: "og:title", content: "Donation details — FoodBridge" },
      { property: "og:description", content: "Pickup details and live tracking for a surplus food donation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <ProtectedRoute>
      <DonationDetail />
    </ProtectedRoute>
  ),
});

function DonationDetail() {
  const { id } = Route.useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { data: d, isLoading, isError, error, refetch } = useQuery(donationQueries.detail(id));

  if (isLoading) return <PageSkeleton />;
  if (isError || !d)
    return (
      <div className="container-page py-10">
        <ErrorState message={getErrorMessage(error, "Donation not found.")} onRetry={() => void refetch()} />
      </div>
    );

  return (
    <div className="container-page py-6 sm:py-10">
      <button
        onClick={() => router.history.back()}
        className="mb-5 inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back
      </button>

      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <div className="relative aspect-[16/10] overflow-hidden rounded-3xl bg-muted shadow-card">
            <FoodImage src={d.imageUrl} alt={d.title} />
            <div className="absolute left-4 top-4 flex gap-2">
              <StatusBadge status={d.status} />
            </div>
          </div>

          <section className="rounded-3xl border bg-card p-6 shadow-card">
            <h2 className="font-sans text-base font-bold">Tracking</h2>
            <div className="mt-5">
              <StatusTimeline donation={d} />
            </div>
          </section>

          <section className="rounded-3xl border bg-card p-6 shadow-card">
            <h2 className="font-sans text-base font-bold">About this food</h2>
            <p className="mt-2 leading-relaxed text-muted-foreground">{d.description}</p>
            {d.notes && (
              <div className="mt-4 flex gap-3 rounded-2xl bg-warm-soft p-4 text-sm">
                <StickyNote className="size-4 shrink-0 text-warm" />
                <p>{d.notes}</p>
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border bg-card p-6 shadow-card">
            <div className="flex items-center justify-between gap-2">
              <FoodTypeDot type={d.foodType} />
              {d.status === "available" && <Countdown expiresAt={d.expiresAt} />}
            </div>
            <h1 className="mt-3 text-3xl font-semibold leading-tight">{d.title}</h1>

            <dl className="mt-5 space-y-3.5 text-sm">
              <Info icon={d.unit === "kg" ? Scale : Users} label="Quantity">
                <span className="font-semibold">
                  {d.quantity} {d.unit}
                </span>
              </Info>
              <Info icon={Store} label="Donor">
                {d.donor.name}
                {d.donor.organizationType && (
                  <span className="text-muted-foreground"> · {ORG_TYPE_LABELS[d.donor.organizationType]}</span>
                )}
              </Info>
              <Info icon={MapPin} label="Pickup address">
                {d.pickupAddress}
                {d.distanceKm != null && (
                  <span className="ml-1 inline-flex items-center gap-0.5 text-muted-foreground">
                    · <Navigation className="size-3" /> {d.distanceKm} km away
                  </span>
                )}
              </Info>
              <Info icon={CalendarClock} label="Pickup window">
                {format(new Date(d.pickupWindowStart), "d MMM, h:mm a")} – {format(new Date(d.pickupWindowEnd), "h:mm a")}
              </Info>
              <Info icon={CalendarClock} label="Safe to eat until">
                {format(new Date(d.expiresAt), "d MMM, h:mm a")}
              </Info>
              {d.claim && (
                <Info icon={HandHeart} label="Claimed by">
                  {d.claim.ngoName}
                  {d.claim.pickupTime && (
                    <span className="block text-muted-foreground">
                      Pickup at {format(new Date(d.claim.pickupTime), "d MMM, h:mm a")}
                    </span>
                  )}
                </Info>
              )}
              {(user?.role !== "ngo" || d.claim?.ngoId === user.id) && (
                <Info icon={Phone} label="Contact">
                  {user?.role === "ngo" || user?.role === "admin" ? (
                    <a href={`tel:${d.donor.phone}`} className="font-semibold text-primary">
                      {d.donor.phone}
                    </a>
                  ) : d.claim ? (
                    <a href={`tel:${d.claim.ngoPhone}`} className="font-semibold text-primary">
                      {d.claim.ngoPhone}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">Shown once an NGO claims it</span>
                  )}
                </Info>
              )}
            </dl>
          </div>

          {user && <Actions donation={d} user={user} />}
        </aside>
      </div>
    </div>
  );
}

function Info({ icon: Icon, label, children }: { icon: typeof MapPin; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
        <Icon className="size-4" />
      </span>
      <div>
        <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
        <dd>{children}</dd>
      </div>
    </div>
  );
}

function Actions({ donation: d, user }: { donation: Donation; user: User }) {
  const [claimOpen, setClaimOpen] = useState(false);
  const status = useUpdateDonationStatus();

  if (user.role === "ngo") {
    const verified = user.verificationStatus === "verified";
    if (d.status === "available") {
      return (
        <div className="rounded-3xl border bg-card p-5 shadow-card">
          {verified ? (
            <>
              <Button size="lg" className="w-full" onClick={() => setClaimOpen(true)}>
                <HandHeart /> Claim donation
              </Button>
              <p className="mt-2 text-center text-xs text-muted-foreground">You'll choose a pickup time next.</p>
              <ClaimDialog donation={d} open={claimOpen} onOpenChange={setClaimOpen} />
            </>
          ) : (
            <div className="flex gap-3 text-sm">
              <Lock className="size-5 shrink-0 text-warning" />
              <div>
                <p className="font-semibold">Only verified NGOs can claim</p>
                <p className="text-muted-foreground">
                  {user.verificationStatus === "rejected"
                    ? "Your verification wasn't approved."
                    : "Your documents are being reviewed. You'll be able to claim once approved."}{" "}
                  <Link to="/pending-verification" className="font-semibold text-primary">
                    View status
                  </Link>
                </p>
              </div>
            </div>
          )}
        </div>
      );
    }
    if (d.status === "claimed" && d.claim?.ngoId === user.id) {
      return (
        <div className="rounded-3xl border bg-card p-5 shadow-card">
          <Button
            size="lg"
            className="w-full"
            disabled={status.isPending}
            onClick={() => status.mutate({ id: d.id, status: "collected" })}
          >
            <CheckCircle2 /> Mark as collected
          </Button>
          <p className="mt-2 text-center text-xs text-muted-foreground">Confirm once you've picked up the food.</p>
        </div>
      );
    }
    return null;
  }

  if (user.role === "donor" && d.donor.id === user.id) {
    if (d.status !== "available" && d.status !== "claimed") return null;
    return (
      <div className="flex flex-col gap-2 rounded-3xl border bg-card p-5 shadow-card">
        {d.status === "available" && (
          <Button size="lg" variant="outline" asChild>
            <Link to="/donor/donations/$id/edit" params={{ id: d.id }}>
              <Pencil /> Edit donation
            </Link>
          </Button>
        )}
        {d.status === "claimed" && (
          <Button size="lg" disabled={status.isPending} onClick={() => status.mutate({ id: d.id, status: "collected" })}>
            <CheckCircle2 /> Confirm handed over
          </Button>
        )}
        <CancelDonationDialog
          donation={d}
          trigger={
            <Button variant="ghost" className="text-destructive hover:bg-destructive-soft hover:text-destructive">
              <XCircle /> Cancel donation
            </Button>
          }
        />
      </div>
    );
  }

  return null;
}
