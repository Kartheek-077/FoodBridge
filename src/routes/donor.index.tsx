import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { format } from "date-fns";
import { CheckCircle2, Clock, Eye, HandHeart, Package, PackageCheck, Pencil, Plus, Trash2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, StatCard } from "@/components/PageHeader";
import { ListSkeleton, StatsSkeleton } from "@/components/Skeletons";
import { EmptyState, ErrorState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { Countdown } from "@/components/Countdown";
import { FoodImage } from "@/components/FoodImage";
import { CancelDonationDialog } from "@/components/CancelDonationDialog";
import { donationQueries, useDeleteDonation, useUpdateDonationStatus } from "@/hooks/use-donations";
import { useAuth } from "@/context/AuthContext";
import { getErrorMessage } from "@/lib/api";
import type { Donation, DonationStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/donor/")({
  head: () => ({
    meta: [
      { title: "Donor dashboard — FoodBridge" },
      { name: "description", content: "Track your food donations, claims and pickups on FoodBridge." },
      { property: "og:title", content: "Donor dashboard — FoodBridge" },
      { property: "og:description", content: "Track your food donations, claims and pickups." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DonorDashboard,
});

type Filter = "all" | "available" | "claimed" | "collected" | "closed";
const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "available", label: "Active" },
  { key: "claimed", label: "Claimed" },
  { key: "collected", label: "Collected" },
  { key: "closed", label: "Expired & cancelled" },
];

function matches(d: Donation, f: Filter) {
  if (f === "all") return true;
  if (f === "closed") return d.status === "expired" || d.status === "cancelled";
  return d.status === f;
}

function DonorDashboard() {
  const { user } = useAuth();
  const { data, isLoading, isError, error, refetch } = useQuery(donationQueries.mine());
  const [filter, setFilter] = useState<Filter>("all");

  const count = (s: DonationStatus) => data?.filter((d) => d.status === s).length ?? 0;
  const list = data?.filter((d) => matches(d, filter)) ?? [];

  return (
    <div className="container-page py-8 sm:py-10">
      <PageHeader
        eyebrow={user?.name}
        title="Your donations"
        description="Every listing reaches verified NGOs nearby in real time."
        actions={
          <Button size="lg" variant="warm" asChild>
            <Link to="/donor/donations/new">
              <Plus /> Create donation
            </Link>
          </Button>
        }
      />

      {isLoading ? (
        <StatsSkeleton />
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Total donations" value={data?.length ?? 0} icon={<Package className="size-4" />} />
          <StatCard label="Active" value={count("available")} icon={<Clock className="size-4" />} tone="warm" />
          <StatCard label="Claimed" value={count("claimed")} icon={<HandHeart className="size-4" />} tone="info" />
          <StatCard label="Collected" value={count("collected")} icon={<PackageCheck className="size-4" />} />
        </div>
      )}

      <div className="mt-10 flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "shrink-0 rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors",
              filter === f.key ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {isLoading ? (
          <ListSkeleton />
        ) : isError ? (
          <ErrorState message={getErrorMessage(error)} onRetry={() => void refetch()} />
        ) : list.length === 0 ? (
          <EmptyState
            icon={Package}
            title={filter === "all" ? "No donations yet" : "Nothing here"}
            description={
              filter === "all"
                ? "Got extra food today? Post it in a minute and a verified NGO will collect it."
                : "No donations match this filter."
            }
            action={
              filter === "all" && (
                <Button asChild>
                  <Link to="/donor/donations/new">
                    <Plus /> Create your first donation
                  </Link>
                </Button>
              )
            }
          />
        ) : (
          <ul className="space-y-3">
            {list.map((d) => (
              <DonationRow key={d.id} donation={d} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function DonationRow({ donation: d }: { donation: Donation }) {
  const del = useDeleteDonation();
  const status = useUpdateDonationStatus();
  return (
    <li className="flex flex-col gap-4 rounded-2xl border bg-card p-4 shadow-soft sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-muted sm:size-20">
          <FoodImage src={d.imageUrl} alt={d.title} />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/donations/$id" params={{ id: d.id }} className="truncate font-bold hover:text-primary">
              {d.title}
            </Link>
            <StatusBadge status={d.status} />
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {d.quantity} {d.unit} · posted {format(new Date(d.createdAt), "d MMM, h:mm a")}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
            {d.status === "available" && <Countdown expiresAt={d.expiresAt} />}
            {d.claim && (
              <span className="font-medium text-info">
                <HandHeart className="mr-1 inline size-3.5" />
                {d.claim.ngoName}
                {d.claim.pickupTime && ` · pickup ${format(new Date(d.claim.pickupTime), "h:mm a")}`}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 sm:justify-end">
        <Button size="sm" variant="ghost" asChild>
          <Link to="/donations/$id" params={{ id: d.id }}>
            <Eye /> Track
          </Link>
        </Button>
        {d.status === "available" && (
          <Button size="sm" variant="outline" asChild>
            <Link to="/donor/donations/$id/edit" params={{ id: d.id }}>
              <Pencil /> Edit
            </Link>
          </Button>
        )}
        {d.status === "claimed" && (
          <Button
            size="sm"
            variant="soft"
            disabled={status.isPending}
            onClick={() => status.mutate({ id: d.id, status: "collected" })}
          >
            <CheckCircle2 /> Mark collected
          </Button>
        )}
        {(d.status === "available" || d.status === "claimed") && (
          <CancelDonationDialog
            donation={d}
            trigger={
              <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive-soft hover:text-destructive">
                <XCircle /> Cancel
              </Button>
            }
          />
        )}
        {(d.status === "expired" || d.status === "cancelled") && (
          <Button
            size="sm"
            variant="ghost"
            className="text-muted-foreground hover:text-destructive"
            disabled={del.isPending}
            onClick={() => del.mutate(d.id)}
          >
            <Trash2 /> Remove
          </Button>
        )}
      </div>
    </li>
  );
}
