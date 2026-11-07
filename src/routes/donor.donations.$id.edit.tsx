import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Lock } from "lucide-react";
import { DonationForm } from "@/components/DonationForm";
import { PageHeader } from "@/components/PageHeader";
import { PageSkeleton } from "@/components/Skeletons";
import { EmptyState, ErrorState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { donationQueries, useUpdateDonation } from "@/hooks/use-donations";
import { getErrorMessage } from "@/lib/api";

export const Route = createFileRoute("/donor/donations/$id/edit")({
  head: () => ({
    meta: [
      { title: "Edit donation — FoodBridge" },
      { name: "description", content: "Update the details of your food donation." },
      { property: "og:title", content: "Edit donation — FoodBridge" },
      { property: "og:description", content: "Update the details of your food donation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: EditDonation,
});

function EditDonation() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { data, isLoading, isError, error, refetch } = useQuery(donationQueries.detail(id));
  const update = useUpdateDonation(id);

  if (isLoading) return <PageSkeleton />;
  if (isError || !data)
    return (
      <div className="container-page py-10">
        <ErrorState message={getErrorMessage(error, "Donation not found.")} onRetry={() => void refetch()} />
      </div>
    );

  if (data.status !== "available")
    return (
      <div className="container-page py-10">
        <EmptyState
          icon={Lock}
          title="This donation can't be edited"
          description="Only donations that haven't been claimed yet can be edited."
          action={
            <Button asChild>
              <Link to="/donations/$id" params={{ id }}>
                View donation
              </Link>
            </Button>
          }
        />
      </div>
    );

  return (
    <div className="container-page py-8 sm:py-10">
      <PageHeader eyebrow="Edit donation" title={data.title} />
      <DonationForm
        initial={data}
        submitting={update.isPending}
        submitLabel="Save changes"
        onCancel={() => navigate({ to: "/donor" })}
        onSubmit={(input) => update.mutate(input, { onSuccess: () => navigate({ to: "/donations/$id", params: { id } }) })}
      />
    </div>
  );
}
