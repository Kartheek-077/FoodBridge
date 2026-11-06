import { UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";

export function FoodImage({ src, alt, className }: { src?: string | null; alt: string; className?: string }) {
  if (!src)
    return (
      <div className={cn("grid size-full place-items-center bg-primary-soft text-primary", className)}>
        <UtensilsCrossed className="size-10 opacity-60" />
      </div>
    );
  return <img src={src} alt={alt} loading="lazy" className={cn("size-full object-cover", className)} />;
}
