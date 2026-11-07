import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight, Flame, HandHeart, MapPin, PackageSearch, Phone, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/PageHeader";
import { DonationCard } from "@/components/DonationCard";
import { GridSkeleton, ListSkeleton } from "@/components/Skeletons";
import { EmptyState, ErrorState } from "@/components/EmptyState";
import { VerificationBanner } from "@/components/VerificationBanner";
import { StatusBadge } from "@/components/StatusBadge";
import { FoodImage } from "@/components/FoodImage";
import { donationQueries } from "@/hooks/use-donations";
import { useAuth } from "@/context/AuthContext";
import { getErrorMessage } from "@/lib/api";
import type { Donation, FoodType } from "@/lib/types";
import { cn } from "@/lib/utils";

interface NgoSearch {
  tab: "browse" | "claims";
  q?: string | undefined;
  foodType?: FoodType | undefined;
  location?: string | undefined;
  soon?: boolean | undefined;
  page?: number | undefined;
}

export const Route = createFileRoute("/ngo/")({
  validateSearch: (s: Record<string, unknown>): NgoSearch => ({
    tab: s["tab"] === "claims" ? "claims" : "browse",
    q: typeof s["q"] === "string" && s["q"] ? s["q"] : undefined,
    foodType: s["foodType"] === "veg" || s["foodType"] === "non-veg" || s["foodType"] === "both" ? s["foodType"] : undefined,
    location: typeof s["location"] === "string" && s["location"] ? s["location"] : undefined,
    soon: s["soon"] === true || s["soon"] === "true" ? true : undefined,
    page: Number(s["page"]) > 1 ? Number(s["page"]) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "NGO dashboard — FoodBridge" },
      { name: "description", content: "Browse surplus food donations near you and track your claims." },
      { property: "og:title", content: "NGO dashboard — FoodBridge" },
      { property: "og:description", content: "Browse surplus food donations and track your claims." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NgoDashboard,
});

function NgoDashboard() {
  const search = Route.useSearch();
  const { user } = useAuth();
  const claims = useQuery(donationQueries.claims());
  const activeClaims = claims.data?.filter((d) => d.status === "claimed").length ?? 0;

  return (
    <div className="container-page py-8 sm:py-10">
      {user && <VerificationBanner user={user} />}
      <PageHeader
        eyebrow={user?.organizationName ?? user?.name}
        title={search.tab === "browse" ? "Food available near you" : "My claims"}
        description={
          search.tab === "browse"
            ? "Claim what you can collect before it expires. New donations appear here instantly."
            : "Track the food you've claimed from pickup to collection."
        }
      />
      <div className="mb-6 inline-flex rounded-full border bg-card p-1 shadow-soft">
        {(
          [
            ["browse", "Browse donations"],
            ["claims", `My claims${activeClaims ? ` (${activeClaims})` : ""}`],
          ] as const
        ).map(([key, label]) => (
          <Link
            key={key}
            to="/ngo"
            search={{ tab: key }}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
              search.tab === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </Link>
        ))}
      </div>
      {search.tab === "browse" ? <BrowseTab search={search} /> : <ClaimsTab data={claims.data} loading={claims.isLoading} error={claims.error} refetch={claims.refetch} />}
    </div>
  );
}

function BrowseTab({ search }: { search: NgoSearch }) {
  const navigate = useNavigate({ from: "/ngo/" });
  const [q, setQ] = useState(search.q ?? "");
  const [loc, setLoc] = useState(search.location ?? "");

  // Debounce text filters into the URL
  useEffect(() => {
    const t = setTimeout(() => {
      if ((search.q ?? "") !== q || (search.location ?? "") !== loc)
        void navigate({ search: (s) => ({ ...s, q: q || undefined, location: loc || undefined, page: undefined }), replace: true });
    }, 350);
    return () => clearTimeout(t);
  }, [q, loc]); // eslint-disable-line react-hooks/exhaustive-deps

  const params = {
    status: "available" as const,
    search: search.q,
    foodType: search.foodType,
    location: search.location,
    expiringSoon: search.soon,
    page: search.page ?? 1,
  };
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    ...donationQueries.list(params),
    placeholderData: keepPreviousData,
  });

  const setFilter = (patch: Partial<NgoSearch>) =>
    void navigate({ search: (s) => ({ ...s, ...patch, page: undefined }), replace: true });

  const hasFilters = !!(search.q || search.foodType || search.location || search.soon);

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 rounded-2xl border bg-card p-3 shadow-soft lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search food or donor…" className="h-10 rounded-xl pl-9" />
        </div>
        <div className="relative lg:w-56">
          <MapPin className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={loc} onChange={(e) => setLoc(e.target.value)} placeholder="Area, e.g. Begumpet" className="h-10 rounded-xl pl-9" />
        </div>
        <div className="flex flex-wrap gap-2">
          {(
            [
              [undefined, "All"],
              ["veg", "Veg"],
              ["non-veg", "Non-veg"],
              ["both", "Mixed"],
            ] as const
          ).map(([v, l]) => (
            <button
              key={l}
              onClick={() => setFilter({ foodType: v })}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm font-semibold",
                search.foodType === v ? "border-primary bg-primary-soft text-primary-deep" : "hover:bg-muted",
              )}
            >
              {l}
            </button>
          ))}
          <button
            onClick={() => setFilter({ soon: search.soon ? undefined : true })}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-3.5 py-1.5 text-sm font-semibold",
              search.soon ? "border-warm bg-warm-soft text-warm" : "hover:bg-muted",
            )}
          >
            <Flame className="size-3.5" /> Expiring soon
          </button>
        </div>
      </div>

      {hasFilters && (
        <button
          onClick={() => {
            setQ("");
            setLoc("");
            void navigate({ search: { tab: "browse" }, replace: true });
          }}
          className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" /> Clear filters
        </button>
      )}

      {isLoading ? (
        <GridSkeleton />
      ) : isError ? (
        <ErrorState message={getErrorMessage(error)} onRetry={() => void refetch()} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={PackageSearch}
          title={hasFilters ? "No donations match" : "No food available right now"}
          description={
            hasFilters ? "Try widening your filters." : "We'll alert you the moment a donor nearby posts surplus food."
          }
        />
      ) : (
        <>
          <div className={cn("grid gap-5 transition-opacity sm:grid-cols-2 lg:grid-cols-3", isFetching && "opacity-70")}>
            {data.items.map((d) => (
              <DonationCard key={d.id} donation={d} />
            ))}
          </div>
          {data.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                disabled={data.page <= 1}
                onClick={() => navigate({ search: (s) => ({ ...s, page: data.page - 1 > 1 ? data.page - 1 : undefined }) })}
              >
                <ChevronLeft /> Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {data.page} of {data.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={data.page >= data.totalPages}
                onClick={() => navigate({ search: (s) => ({ ...s, page: data.page + 1 }) })}
              >
                Next <ChevronRight />
              </Button>
            </div>
          )}
        </>
      )}
    </>
  );
}

function ClaimsTab({
  data,
  loading,
  error,
  refetch,
}: {
  data: Donation[] | undefined;
  loading: boolean;
  error: unknown;
  refetch: () => unknown;
}) {
  if (loading) return <ListSkeleton />;
  if (error) return <ErrorState message={getErrorMessage(error)} onRetry={() => void refetch()} />;
  if (!data?.length)
    return (
      <EmptyState
        icon={HandHeart}
        title="No claims yet"
        description="When you claim a donation it shows up here so you can track pickup and collection."
        action={
          <Button asChild>
            <Link to="/ngo" search={{ tab: "browse" }}>
              Browse donations
            </Link>
          </Button>
        }
      />
    );

  const groups = [
    { title: "Awaiting pickup", items: data.filter((d) => d.status === "claimed") },
    { title: "Collected", items: data.filter((d) => d.status === "collected") },
    { title: "Cancelled by donor", items: data.filter((d) => d.status === "cancelled" || d.status === "expired") },
  ].filter((g) => g.items.length);

  return (
    <div className="space-y-8">
      {groups.map((g) => (
        <section key={g.title}>
          <h2 className="mb-3 font-sans text-sm font-bold uppercase tracking-wider text-muted-foreground">
            {g.title} · {g.items.length}
          </h2>
          <ul className="space-y-3">
            {g.items.map((d) => (
              <li key={d.id}>
                <Link
                  to="/donations/$id"
                  params={{ id: d.id }}
                  className="flex items-center gap-4 rounded-2xl border bg-card p-4 shadow-soft transition-colors hover:border-primary"
                >
                  <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                    <FoodImage src={d.imageUrl} alt={d.title} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-bold">{d.title}</p>
                      <StatusBadge status={d.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {d.donor.name} · {d.quantity} {d.unit}
                    </p>
                    <p className="mt-1 flex flex-wrap gap-x-4 text-xs text-muted-foreground">
                      {d.claim?.pickupTime && <span>Pickup {format(new Date(d.claim.pickupTime), "d MMM, h:mm a")}</span>}
                      <span className="inline-flex items-center gap-1">
                        <Phone className="size-3" /> {d.donor.phone}
                      </span>
                    </p>
                  </div>
                  <ChevronRight className="size-5 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
