import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { format } from "date-fns";
import { Loader2, LogOut, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageHeader } from "@/components/PageHeader";
import { VerificationBadge } from "@/components/StatusBadge";
import { useAuth } from "@/context/AuthContext";
import { authApi, getErrorMessage } from "@/lib/api";
import { ORG_TYPE_LABELS } from "@/lib/donation-utils";
import { USE_MOCK } from "@/lib/config";
import { resetDb } from "@/lib/mock/db";
import { useToastPreference } from "@/hooks/use-preferences";
import type { OrgType, User } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile & settings — FoodBridge" },
      { name: "description", content: "Manage your FoodBridge profile, contact details and notification settings." },
      { property: "og:title", content: "Profile & settings — FoodBridge" },
      { property: "og:description", content: "Manage your FoodBridge profile and settings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <ProtectedRoute>
      <ProfilePage />
    </ProtectedRoute>
  ),
});

const schema = z.object({
  name: z.string().trim().min(2, "Enter a name").max(120),
  phone: z
    .string()
    .trim()
    .regex(/^[+\d][\d\s-]{7,16}$/, "Enter a valid phone number"),
  address: z.string().trim().min(8, "Enter your full address").max(200),
  serviceArea: z.string().trim().max(200).optional(),
});

function ProfilePage() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <div className="container-page max-w-3xl py-8 sm:py-10">
      <PageHeader title="Profile & settings" description="Keep your details current so partners can reach you." />
      <div className="space-y-6">
        <ProfileForm user={user} />
        <SettingsCard />
      </div>
    </div>
  );
}

function ProfileForm({ user }: { user: User }) {
  const { setUser } = useAuth();
  const [orgType, setOrgType] = useState<OrgType | undefined>(user.organizationType);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: user.role === "ngo" ? (user.organizationName ?? user.name) : user.name,
      phone: user.phone,
      address: user.address,
      serviceArea: user.serviceArea ?? "",
    },
  });

  const onSubmit = handleSubmit(async (v) => {
    try {
      const patch: Partial<User> =
        user.role === "ngo"
          ? { organizationName: v.name, phone: v.phone, address: v.address, serviceArea: v.serviceArea ?? "" }
          : { name: v.name, phone: v.phone, address: v.address, ...(orgType ? { organizationType: orgType } : {}) };
      const updated = await authApi.updateMe(patch);
      setUser(updated);
      toast.success("Profile saved");
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  });

  const err = (m?: string) => (m ? <p className="mt-1.5 text-xs font-medium text-destructive">{m}</p> : null);

  return (
    <form onSubmit={onSubmit} className="rounded-3xl border bg-card p-6 shadow-card sm:p-8" noValidate>
      <div className="mb-6 flex flex-wrap items-center gap-3 border-b pb-6">
        <span className="grid size-14 place-items-center rounded-2xl bg-gradient-primary font-display text-xl font-semibold text-primary-foreground">
          {user.name.slice(0, 1)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-bold">{user.name}</p>
          <p className="text-sm capitalize text-muted-foreground">
            {user.role} · {user.email} · joined {format(new Date(user.createdAt), "MMM yyyy")}
          </p>
        </div>
        {user.role === "ngo" && <VerificationBadge status={user.verificationStatus} />}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="name">{user.role === "ngo" ? "Organization name" : "Name / business name"}</Label>
          <Input id="name" className="mt-1.5" {...register("name")} />
          {err(errors.name?.message)}
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" className="mt-1.5" value={user.email} disabled />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" className="mt-1.5" {...register("phone")} />
          {err(errors.phone?.message)}
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="address">Address</Label>
          <Textarea id="address" className="mt-1.5 min-h-16" {...register("address")} />
          {err(errors.address?.message)}
        </div>
        {user.role === "donor" && (
          <div className="sm:col-span-2">
            <Label>Organization type</Label>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {(Object.keys(ORG_TYPE_LABELS) as OrgType[]).map((k) => (
                <button
                  type="button"
                  key={k}
                  onClick={() => setOrgType(k)}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-sm font-semibold",
                    orgType === k ? "border-primary bg-primary-soft text-primary-deep" : "hover:bg-muted",
                  )}
                >
                  {ORG_TYPE_LABELS[k]}
                </button>
              ))}
            </div>
          </div>
        )}
        {user.role === "ngo" && (
          <>
            <div>
              <Label>Registration number</Label>
              <Input className="mt-1.5" value={user.registrationNumber ?? ""} disabled />
            </div>
            <div>
              <Label htmlFor="serviceArea">Service area</Label>
              <Input id="serviceArea" className="mt-1.5" {...register("serviceArea")} />
              {err(errors.serviceArea?.message)}
            </div>
          </>
        )}
      </div>
      <div className="mt-6 flex justify-end">
        <Button type="submit" disabled={isSubmitting || (!isDirty && orgType === user.organizationType)}>
          {isSubmitting && <Loader2 className="animate-spin" />} Save changes
        </Button>
      </div>
    </form>
  );
}

function SettingsCard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [toasts, setToasts] = useToastPreference();

  return (
    <div className="rounded-3xl border bg-card p-6 shadow-card sm:p-8">
      <h2 className="font-sans text-base font-bold">Settings</h2>
      <div className="mt-4 flex items-center justify-between gap-4 rounded-2xl border p-4">
        <div>
          <p className="font-semibold">Pop-up alerts</p>
          <p className="text-sm text-muted-foreground">Show a pop-up when a new notification arrives.</p>
        </div>
        <Switch checked={toasts} onCheckedChange={setToasts} aria-label="Pop-up alerts" />
      </div>
      {USE_MOCK && (
        <div className="mt-3 flex items-center justify-between gap-4 rounded-2xl border border-dashed p-4">
          <div>
            <p className="font-semibold">Reset sample data</p>
            <p className="text-sm text-muted-foreground">Restore the demo donations, users and notifications.</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              resetDb();
              logout();
              toast.success("Sample data restored");
              void navigate({ to: "/login", search: { redirect: undefined } });
            }}
          >
            <RotateCcw /> Reset
          </Button>
        </div>
      )}
      <Button
        variant="ghost"
        className="mt-4 text-destructive hover:bg-destructive-soft hover:text-destructive"
        onClick={() => {
          logout();
          void navigate({ to: "/login", search: { redirect: undefined }, replace: true });
        }}
      >
        <LogOut /> Log out
      </Button>
    </div>
  );
}
