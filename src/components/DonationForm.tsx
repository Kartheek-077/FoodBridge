import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ImagePlus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fromLocalInput, toLocalInput } from "@/lib/donation-utils";
import type { Donation, DonationInput } from "@/lib/types";
import { cn } from "@/lib/utils";

const MAX_IMAGE_MB = 5;

const schema = z
  .object({
    title: z.string().trim().min(3, "Give the food a short title").max(80, "Keep it under 80 characters"),
    description: z.string().trim().min(10, "Describe the food in a sentence or two").max(600, "Keep it under 600 characters"),
    foodType: z.enum(["veg", "non-veg", "both"]),
    quantity: z.coerce.number({ invalid_type_error: "Enter a number" }).positive("Must be more than 0").max(10000, "That seems too large"),
    unit: z.enum(["servings", "kg"]),
    pickupAddress: z.string().trim().min(8, "Enter the full pickup address").max(200),
    pickupWindowStart: z.string().min(1, "Choose a start time"),
    pickupWindowEnd: z.string().min(1, "Choose an end time"),
    expiresAt: z.string().min(1, "Choose when the food expires"),
    notes: z.string().trim().max(400, "Keep notes under 400 characters").optional(),
  })
  .refine((v) => new Date(v.pickupWindowEnd) > new Date(v.pickupWindowStart), {
    path: ["pickupWindowEnd"],
    message: "Pickup must end after it starts",
  })
  .refine((v) => new Date(v.expiresAt).getTime() > Date.now(), {
    path: ["expiresAt"],
    message: "Expiry must be in the future",
  })
  .refine((v) => new Date(v.expiresAt) >= new Date(v.pickupWindowStart), {
    path: ["expiresAt"],
    message: "Food should not expire before pickup starts",
  });

type FormValues = z.infer<typeof schema>;

function defaultTimes() {
  const start = new Date(Date.now() + 30 * 60_000);
  start.setMinutes(start.getMinutes() < 30 ? 30 : 60, 0, 0);
  const end = new Date(start.getTime() + 3 * 3600_000);
  const exp = new Date(start.getTime() + 6 * 3600_000);
  return { start: toLocalInput(start.toISOString()), end: toLocalInput(end.toISOString()), exp: toLocalInput(exp.toISOString()) };
}

export function DonationForm({
  initial,
  defaultAddress,
  submitting,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: Donation | undefined;
  defaultAddress?: string | undefined;
  submitting?: boolean | undefined;
  submitLabel: string;
  onSubmit: (input: DonationInput) => void;
  onCancel?: (() => void) | undefined;
}) {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(initial?.imageUrl ?? null);
  const [imageError, setImageError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: initial?.title ?? "",
      description: initial?.description ?? "",
      foodType: initial?.foodType ?? "veg",
      quantity: initial?.quantity ?? ("" as unknown as number),
      unit: initial?.unit ?? "servings",
      pickupAddress: initial?.pickupAddress ?? defaultAddress ?? "",
      pickupWindowStart: toLocalInput(initial?.pickupWindowStart),
      pickupWindowEnd: toLocalInput(initial?.pickupWindowEnd),
      expiresAt: toLocalInput(initial?.expiresAt),
      notes: initial?.notes ?? "",
    },
  });

  // Fill default times after mount (avoids SSR/client time mismatch).
  useEffect(() => {
    if (initial) return;
    const t = defaultTimes();
    reset((v) => ({ ...v, pickupWindowStart: t.start, pickupWindowEnd: t.end, expiresAt: t.exp }));
  }, [initial, reset]);

  useEffect(() => {
    if (!image) return;
    const url = URL.createObjectURL(image);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  const foodType = watch("foodType");
  const unit = watch("unit");

  const onFile = (f: File | undefined) => {
    setImageError(null);
    if (!f) return;
    if (!f.type.startsWith("image/")) return setImageError("Please choose an image file (JPG, PNG, WEBP).");
    if (f.size > MAX_IMAGE_MB * 1024 * 1024) return setImageError(`Image must be under ${MAX_IMAGE_MB} MB.`);
    setImage(f);
  };

  const submit = handleSubmit((v) =>
    onSubmit({
      ...v,
      pickupWindowStart: fromLocalInput(v.pickupWindowStart),
      pickupWindowEnd: fromLocalInput(v.pickupWindowEnd),
      expiresAt: fromLocalInput(v.expiresAt),
      notes: v.notes ?? "",
      image,
    }),
  );

  const err = (k: keyof FormValues) =>
    errors[k] ? <p className="mt-1.5 text-xs font-medium text-destructive">{errors[k]?.message as string}</p> : null;

  return (
    <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1fr_20rem]" noValidate>
      <div className="space-y-6 rounded-2xl border bg-card p-5 shadow-card sm:p-7">
        <section className="space-y-4">
          <h2 className="font-sans text-base font-bold">What are you donating?</h2>
          <div>
            <Label htmlFor="title">Food title</Label>
            <Input id="title" className="mt-1.5" placeholder="e.g. Veg biryani & raita" {...register("title")} />
            {err("title")}
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              className="mt-1.5 min-h-24"
              placeholder="What's included, how it was stored, packaging…"
              {...register("description")}
            />
            {err("description")}
          </div>
          <div>
            <Label>Food type</Label>
            <div className="mt-1.5 grid grid-cols-3 gap-2">
              {(
                [
                  ["veg", "Veg"],
                  ["non-veg", "Non-veg"],
                  ["both", "Both"],
                ] as const
              ).map(([v, l]) => (
                <button
                  type="button"
                  key={v}
                  onClick={() => setValue("foodType", v, { shouldValidate: true })}
                  className={cn(
                    "rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors",
                    foodType === v ? "border-primary bg-primary-soft text-primary-deep" : "hover:bg-muted",
                  )}
                  aria-pressed={foodType === v}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-[1fr_auto] gap-3">
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input id="quantity" type="number" min={1} step="any" inputMode="decimal" className="mt-1.5" {...register("quantity")} />
              {err("quantity")}
            </div>
            <div>
              <Label>Unit</Label>
              <div className="mt-1.5 flex rounded-xl border p-1">
                {(["servings", "kg"] as const).map((u) => (
                  <button
                    type="button"
                    key={u}
                    onClick={() => setValue("unit", u)}
                    className={cn(
                      "rounded-lg px-3 py-1 text-sm font-semibold",
                      unit === u ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                    )}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4 border-t pt-6">
          <h2 className="font-sans text-base font-bold">Pickup & expiry</h2>
          <div>
            <Label htmlFor="pickupAddress">Pickup address</Label>
            <Input id="pickupAddress" className="mt-1.5" placeholder="Street, area, city" {...register("pickupAddress")} />
            {err("pickupAddress")}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="pickupWindowStart">Pickup from</Label>
              <Input id="pickupWindowStart" type="datetime-local" className="mt-1.5" {...register("pickupWindowStart")} />
              {err("pickupWindowStart")}
            </div>
            <div>
              <Label htmlFor="pickupWindowEnd">Pickup until</Label>
              <Input id="pickupWindowEnd" type="datetime-local" className="mt-1.5" {...register("pickupWindowEnd")} />
              {err("pickupWindowEnd")}
            </div>
          </div>
          <div>
            <Label htmlFor="expiresAt">Food is safe to eat until</Label>
            <Input id="expiresAt" type="datetime-local" className="mt-1.5" {...register("expiresAt")} />
            {err("expiresAt")}
          </div>
          <div>
            <Label htmlFor="notes">Special notes (optional)</Label>
            <Textarea
              id="notes"
              className="mt-1.5"
              placeholder="Allergens, containers needed, who to ask for…"
              {...register("notes")}
            />
            {err("notes")}
          </div>
        </section>
      </div>

      <aside className="space-y-4">
        <div className="rounded-2xl border bg-card p-5 shadow-card">
          <Label>Photo</Label>
          <label
            className={cn(
              "relative mt-2 flex aspect-[4/3] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed text-center transition-colors hover:border-primary hover:bg-primary-soft/40",
              preview && "border-solid",
            )}
          >
            {preview ? (
              <img src={preview} alt="Food preview" className="absolute inset-0 size-full object-cover" />
            ) : (
              <>
                <ImagePlus className="size-8 text-primary" />
                <span className="mt-2 text-sm font-semibold">Add a photo</span>
                <span className="text-xs text-muted-foreground">JPG or PNG, up to {MAX_IMAGE_MB} MB</span>
              </>
            )}
            <input type="file" accept="image/*" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
          </label>
          {preview && image && (
            <button
              type="button"
              onClick={() => {
                setImage(null);
                setPreview(initial?.imageUrl ?? null);
              }}
              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-destructive"
            >
              <X className="size-3.5" /> Remove new photo
            </button>
          )}
          {imageError && <p className="mt-2 text-xs font-medium text-destructive">{imageError}</p>}
          <p className="mt-3 text-xs text-muted-foreground">A clear photo helps NGOs plan transport and portions.</p>
        </div>
        <div className="flex flex-col gap-2">
          <Button type="submit" size="lg" disabled={submitting}>
            {submitting && <Loader2 className="animate-spin" />} {submitLabel}
          </Button>
          {onCancel && (
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </aside>
    </form>
  );
}
