import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { ArrowLeft, FileUp, HandHeart, Loader2, Store } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { getErrorMessage } from "@/lib/api";
import { ORG_TYPE_LABELS } from "@/lib/donation-utils";
import type { OrgType } from "@/lib/types";
import { cn } from "@/lib/utils";

type RoleChoice = "donor" | "ngo";

export const Route = createFileRoute("/register")({
  validateSearch: (s: Record<string, unknown>): { role?: RoleChoice | undefined } => ({
    role: s["role"] === "donor" || s["role"] === "ngo" ? s["role"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Create an account — FoodBridge" },
      {
        name: "description",
        content: "Sign up as a food donor or register your NGO to start rescuing surplus food with FoodBridge.",
      },
      { property: "og:title", content: "Join FoodBridge" },
      { property: "og:description", content: "Register as a food donor or a verified NGO." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RegisterPage,
});

const phone = z
  .string()
  .trim()
  .regex(/^[+\d][\d\s-]{7,16}$/, "Enter a valid phone number");
const password = z.string().min(8, "At least 8 characters").max(72, "Too long");

const donorSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your name or business name").max(100),
    organizationType: z.enum(["restaurant", "hotel", "marriage_hall", "hostel", "event_organizer"], {
      errorMap: () => ({ message: "Choose your organization type" }),
    }),
    email: z.string().trim().email("Enter a valid email").max(255),
    phone,
    address: z.string().trim().min(8, "Enter your full address").max(200),
    password,
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Passwords don't match" });

const ngoSchema = z
  .object({
    organizationName: z.string().trim().min(2, "Enter the organization name").max(120),
    registrationNumber: z.string().trim().min(4, "Enter the registration number").max(60),
    email: z.string().trim().email("Enter a valid email").max(255),
    phone,
    address: z.string().trim().min(8, "Enter your full address").max(200),
    serviceArea: z.string().trim().min(3, "Which areas do you serve?").max(200),
    password,
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Passwords don't match" });

function FieldError({ msg }: { msg?: string | undefined }) {
  return msg ? <p className="mt-1.5 text-xs font-medium text-destructive">{msg}</p> : null;
}

function RegisterPage() {
  const { role } = Route.useSearch();
  const navigate = useNavigate();

  return (
    <div className="bg-dotted min-h-[calc(100vh-4rem)] py-10 sm:py-14">
      <div className="container-page max-w-3xl">
        {!role ? (
          <>
            <div className="text-center">
              <h1 className="text-3xl font-semibold sm:text-4xl">Join FoodBridge</h1>
              <p className="mt-2 text-muted-foreground">How would you like to help?</p>
            </div>
            <div className="mt-10 grid gap-5 sm:grid-cols-2">
              {(
                [
                  {
                    r: "donor",
                    icon: Store,
                    title: "I have surplus food",
                    text: "Restaurants, hotels, marriage halls, hostels and event organizers.",
                    tone: "bg-warm-soft text-warm",
                  },
                  {
                    r: "ngo",
                    icon: HandHeart,
                    title: "We distribute food",
                    text: "Registered NGOs and charities who collect and serve food to people in need.",
                    tone: "bg-primary-soft text-primary",
                  },
                ] as const
              ).map((c) => (
                <button
                  key={c.r}
                  onClick={() => navigate({ to: "/register", search: { role: c.r } })}
                  className="group rounded-3xl border bg-card p-7 text-left shadow-card transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-lift"
                >
                  <span className={cn("grid size-12 place-items-center rounded-2xl", c.tone)}>
                    <c.icon className="size-6" />
                  </span>
                  <h2 className="mt-5 text-xl font-semibold">{c.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{c.text}</p>
                  <p className="mt-5 text-sm font-semibold text-primary">
                    Register as {c.r === "donor" ? "a donor" : "an NGO"} →
                  </p>
                </button>
              ))}
            </div>
            <p className="mt-8 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" search={{ redirect: undefined }} className="font-semibold text-primary hover:underline">
                Log in
              </Link>
            </p>
          </>
        ) : (
          <div className="mx-auto max-w-xl">
            <Link
              to="/register"
              search={{ role: undefined }}
              className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-4" /> Change role
            </Link>
            <div className="mt-4 rounded-3xl border bg-card p-6 shadow-card sm:p-8">
              {role === "donor" ? <DonorForm /> : <NgoForm />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DonorForm() {
  const { register: signUp } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof donorSchema>>({ resolver: zodResolver(donorSchema) });
  const orgType = watch("organizationType");

  const onSubmit = handleSubmit(async (v) => {
    setError(null);
    try {
      await signUp({
        role: "donor",
        name: v.name,
        organizationType: v.organizationType,
        email: v.email,
        phone: v.phone,
        address: v.address,
        password: v.password,
      });
      toast.success("Welcome to FoodBridge!", { description: "Post your first donation whenever you're ready." });
      void navigate({ to: "/donor", replace: true });
    } catch (e) {
      setError(getErrorMessage(e));
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div>
        <h1 className="text-2xl font-semibold">Register as a donor</h1>
        <p className="mt-1 text-sm text-muted-foreground">Share surplus food with verified NGOs nearby.</p>
      </div>
      <div>
        <Label htmlFor="name">Name / business name</Label>
        <Input id="name" className="mt-1.5" {...register("name")} />
        <FieldError msg={errors.name?.message} />
      </div>
      <div>
        <Label>Organization type</Label>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {(Object.keys(ORG_TYPE_LABELS) as OrgType[]).map((k) => (
            <button
              type="button"
              key={k}
              onClick={() => setValue("organizationType", k, { shouldValidate: true })}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors",
                orgType === k ? "border-primary bg-primary-soft text-primary-deep" : "hover:bg-muted",
              )}
              aria-pressed={orgType === k}
            >
              {ORG_TYPE_LABELS[k]}
            </button>
          ))}
        </div>
        <FieldError msg={errors.organizationType?.message} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" className="mt-1.5" {...register("email")} />
          <FieldError msg={errors.email?.message} />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" type="tel" autoComplete="tel" className="mt-1.5" {...register("phone")} />
          <FieldError msg={errors.phone?.message} />
        </div>
      </div>
      <div>
        <Label htmlFor="address">Address</Label>
        <Textarea id="address" className="mt-1.5 min-h-16" placeholder="Street, area, city" {...register("address")} />
        <FieldError msg={errors.address?.message} />
      </div>
      <PasswordFields register={register} errors={errors} />
      {error && <p className="rounded-xl bg-destructive-soft px-3 py-2 text-sm font-medium text-destructive">{error}</p>}
      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="animate-spin" />} Create donor account
      </Button>
    </form>
  );
}

const MAX_DOC_MB = 5;
const DOC_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

function NgoForm() {
  const { register: signUp } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [doc, setDoc] = useState<File | null>(null);
  const [docError, setDocError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof ngoSchema>>({ resolver: zodResolver(ngoSchema) });

  const pickDoc = (f?: File) => {
    setDocError(null);
    if (!f) return;
    if (!DOC_TYPES.includes(f.type)) return setDocError("Upload a PDF, JPG or PNG file.");
    if (f.size > MAX_DOC_MB * 1024 * 1024) return setDocError(`File must be under ${MAX_DOC_MB} MB.`);
    setDoc(f);
  };

  const onSubmit = handleSubmit(async (v) => {
    setError(null);
    if (!doc) {
      setDocError("Upload your registration certificate or trust deed.");
      return;
    }
    try {
      await signUp({
        role: "ngo",
        organizationName: v.organizationName,
        registrationNumber: v.registrationNumber,
        email: v.email,
        phone: v.phone,
        address: v.address,
        serviceArea: v.serviceArea,
        password: v.password,
        document: doc,
      });
      void navigate({ to: "/pending-verification", replace: true });
    } catch (e) {
      setError(getErrorMessage(e));
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div>
        <h1 className="text-2xl font-semibold">Register your NGO</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          We verify every NGO before it can claim food. Keep your registration document handy.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="organizationName">Organization name</Label>
          <Input id="organizationName" className="mt-1.5" {...register("organizationName")} />
          <FieldError msg={errors.organizationName?.message} />
        </div>
        <div>
          <Label htmlFor="registrationNumber">Registration number</Label>
          <Input id="registrationNumber" className="mt-1.5" placeholder="e.g. TS/NGO/2021/01234" {...register("registrationNumber")} />
          <FieldError msg={errors.registrationNumber?.message} />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" className="mt-1.5" {...register("email")} />
          <FieldError msg={errors.email?.message} />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" type="tel" autoComplete="tel" className="mt-1.5" {...register("phone")} />
          <FieldError msg={errors.phone?.message} />
        </div>
      </div>
      <div>
        <Label htmlFor="address">Address</Label>
        <Textarea id="address" className="mt-1.5 min-h-16" {...register("address")} />
        <FieldError msg={errors.address?.message} />
      </div>
      <div>
        <Label htmlFor="serviceArea">Service area</Label>
        <Input id="serviceArea" className="mt-1.5" placeholder="e.g. Ameerpet, Begumpet, Secunderabad" {...register("serviceArea")} />
        <FieldError msg={errors.serviceArea?.message} />
      </div>
      <div>
        <Label>Verification document</Label>
        <label className="mt-1.5 flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed p-4 transition-colors hover:border-primary hover:bg-primary-soft/40">
          <span className="grid size-10 place-items-center rounded-xl bg-primary-soft text-primary">
            <FileUp className="size-5" />
          </span>
          <span className="min-w-0 flex-1 text-sm">
            <span className="block truncate font-semibold">{doc ? doc.name : "Upload registration certificate"}</span>
            <span className="text-xs text-muted-foreground">
              {doc ? `${(doc.size / 1024).toFixed(0)} KB` : `PDF, JPG or PNG, up to ${MAX_DOC_MB} MB`}
            </span>
          </span>
          <input
            type="file"
            accept=".pdf,image/png,image/jpeg,image/webp"
            className="sr-only"
            onChange={(e) => pickDoc(e.target.files?.[0])}
          />
        </label>
        <FieldError msg={docError ?? undefined} />
      </div>
      <PasswordFields register={register} errors={errors} />
      {error && <p className="rounded-xl bg-destructive-soft px-3 py-2 text-sm font-medium text-destructive">{error}</p>}
      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="animate-spin" />} Submit for verification
      </Button>
    </form>
  );
}

function PasswordFields({
  register,
  errors,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: any;
  errors: { password?: { message?: string | undefined } | undefined; confirm?: { message?: string | undefined } | undefined };
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" autoComplete="new-password" className="mt-1.5" {...register("password")} />
        <FieldError msg={errors.password?.message} />
      </div>
      <div>
        <Label htmlFor="confirm">Confirm password</Label>
        <Input id="confirm" type="password" autoComplete="new-password" className="mt-1.5" {...register("confirm")} />
        <FieldError msg={errors.confirm?.message} />
      </div>
    </div>
  );
}
