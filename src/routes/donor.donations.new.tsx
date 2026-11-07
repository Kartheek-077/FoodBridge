import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { DonationForm } from "@/components/DonationForm";
import { PageHeader } from "@/components/PageHeader";
import { useCreateDonation } from "@/hooks/use-donations";
import { useAuth } from "@/context/AuthContext";

export const Route = createFileRoute("/donor/donations/new")({
  head: () => ({
    meta: [
      { title: "Donate food — FoodBridge" },
      { name: "description", content: "Post surplus food so verified NGOs nearby can claim and collect it." },
      { property: "og:title", content: "Donate surplus food — FoodBridge" },
      { property: "og:description", content: "Post surplus food for verified NGOs to collect." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NewDonation,
});

function NewDonation() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const create = useCreateDonation();
  return (
    <div className="container-page py-8 sm:py-10">
      <PageHeader eyebrow="New donation" title="Share your surplus food" description="Takes about a minute. NGOs nearby are alerted the moment you post." />
      <DonationForm
        defaultAddress={user?.address}
        submitting={create.isPending}
        submitLabel="Post donation"
        onCancel={() => navigate({ to: "/donor" })}
        onSubmit={(input) =>
          create.mutate(input, {
            onSuccess: (d) => navigate({ to: "/donations/$id", params: { id: d.id } }),
          })
        }
      />
    </div>
  );
}
