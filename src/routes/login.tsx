import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { homePathForRole, useAuth } from "@/context/AuthContext";
import { getErrorMessage } from "@/lib/api";
import { USE_MOCK } from "@/lib/config";
import { DEMO_ACCOUNTS } from "@/lib/mock/db";
import { LogoMark } from "@/components/Logo";
import heroImg from "@/assets/food-buffet.jpg";

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>): { redirect?: string | undefined } => {
    const r = s["redirect"];
    return { redirect: typeof r === "string" && r.startsWith("/") ? r : undefined };
  },
  _x: ({
  }),
  head: () => ({
    meta: [
      { title: "Log in — FoodBridge" },
      { name: "description", content: "Log in to FoodBridge to donate surplus food or claim donations for your NGO." },
      { property: "og:title", content: "Log in — FoodBridge" },
      { property: "og:description", content: "Access your FoodBridge donor, NGO or admin dashboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LoginPage,
});

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(1, "Enter your password").max(128),
});

function LoginPage() {
  const { login, status, role } = useAuth();
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  // Already signed in → go to dashboard
  useEffect(() => {
    if (status === "authenticated") void navigate({ to: redirect ?? homePathForRole(role), replace: true });
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = handleSubmit(async (v) => {
    setError(null);
    try {
      const user = await login(v.email, v.password);
      toast.success(`Welcome back, ${user.name.split(" ")[0]}!`);
      void navigate({ to: redirect ?? homePathForRole(user.role), replace: true });
    } catch (e) {
      setError(getErrorMessage(e));
    }
  });

  return (
    <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-2">
      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <LogoMark className="size-11" />
          <h1 className="mt-6 text-3xl font-semibold">Welcome back</h1>
          <p className="mt-2 text-muted-foreground">Log in to keep good food moving.</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" className="mt-1.5 h-11" {...register("email")} />
              {errors.email && <p className="mt-1.5 text-xs font-medium text-destructive">{errors.email.message}</p>}
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                className="mt-1.5 h-11"
                {...register("password")}
              />
              {errors.password && <p className="mt-1.5 text-xs font-medium text-destructive">{errors.password.message}</p>}
            </div>
            {error && (
              <p role="alert" className="rounded-xl bg-destructive-soft px-3 py-2 text-sm font-medium text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />} Log in
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            New to FoodBridge?{" "}
            <Link to="/register" className="font-semibold text-primary hover:underline">
              Create an account
            </Link>
          </p>

          {USE_MOCK && (
            <div className="mt-8 rounded-2xl border border-dashed bg-warm-soft/50 p-4">
              <p className="flex items-center gap-1.5 text-sm font-semibold">
                <Sparkles className="size-4 text-warm" /> Demo accounts
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Sample data mode — tap one to fill the form.</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {DEMO_ACCOUNTS.map((a) => (
                  <button
                    type="button"
                    key={a.email}
                    onClick={() => {
                      setValue("email", a.email);
                      setValue("password", a.password);
                    }}
                    className="rounded-xl border bg-card px-3 py-2 text-left text-xs hover:border-primary"
                  >
                    <span className="block font-semibold">{a.label}</span>
                    <span className="block truncate text-muted-foreground">{a.email}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="relative hidden lg:block">
        <img src={heroImg} alt="Surplus buffet food ready for pickup" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-hero-overlay" />
        <div className="absolute bottom-12 left-12 right-12 text-primary-foreground">
          <p className="font-display text-3xl font-semibold leading-tight">
            “We picked up 150 plates from a wedding at midnight. They fed a shelter by breakfast.”
          </p>
          <p className="mt-3 text-sm text-primary-foreground/80">— Annam Seva Foundation</p>
        </div>
      </div>
    </div>
  );
}
