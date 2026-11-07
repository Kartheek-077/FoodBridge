import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { BadgeCheck, Clock, FileCheck2, Search, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";

export const Route = createFileRoute("/pending-verification")({
  head: () => ({
    meta: [
      { title: "Verification status — FoodBridge" },
      { name: "description", content: "Track the verification status of your NGO on FoodBridge." },
      { property: "og:title", content: "NGO verification status — FoodBridge" },
      { property: "og:description", content: "We verify every NGO before it can claim food." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <ProtectedRoute roles={["ngo"]}>
      <PendingPage />
    </ProtectedRoute>
  ),
});

function PendingPage() {
  const { user, refreshUser } = useAuth();
  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);
  if (!user) return null;
  const status = user.verificationStatus ?? "pending";

  const content = {
    pending: {
      icon: Clock,
      tone: "bg-warning-soft text-warning",
      title: "Thanks! Your NGO is under review",
      text: "Our team is checking your registration document. This usually takes less than 24 hours — we'll notify you here and by alert as soon as you're verified.",
    },
    verified: {
      icon: BadgeCheck,
      tone: "bg-success-soft text-success",
      title: "You're verified!",
      text: "Your NGO can now claim surplus food donations near you.",
    },
    rejected: {
      icon: ShieldAlert,
      tone: "bg-destructive-soft text-destructive",
      title: "Verification not approved",
      text: `Reason: ${user.rejectionReason ?? "Not specified"}. Please update your details and contact our team to resubmit.`,
    },
  }[status];

  const Icon = content.icon;

  return (
    <div className="container-page max-w-2xl py-14">
      <div className="rounded-3xl border bg-card p-8 text-center shadow-card sm:p-12">
        <span className={`mx-auto grid size-16 place-items-center rounded-3xl ${content.tone}`}>
          <Icon className="size-8" />
        </span>
        <h1 className="mt-6 text-3xl font-semibold">{content.title}</h1>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">{content.text}</p>

        {status === "pending" && (
          <ol className="mx-auto mt-8 max-w-sm space-y-3 text-left">
            {[
              { icon: FileCheck2, label: "Documents received", done: true },
              { icon: Search, label: "Admin review in progress", done: false },
              { icon: BadgeCheck, label: "Start claiming food", done: false },
            ].map((s) => (
              <li key={s.label} className="flex items-center gap-3 rounded-xl border px-4 py-3">
                <s.icon className={s.done ? "size-5 text-primary" : "size-5 text-muted-foreground"} />
                <span className={s.done ? "font-semibold" : "text-muted-foreground"}>{s.label}</span>
              </li>
            ))}
          </ol>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link to="/ngo" search={{ tab: "browse" }}>
              {status === "verified" ? "Browse donations" : "Browse donations meanwhile"}
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/profile">Review my details</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
