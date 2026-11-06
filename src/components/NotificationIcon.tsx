import { BadgeCheck, HandHeart, PackageCheck, PackagePlus, ShieldAlert, UserPlus, XCircle } from "lucide-react";
import type { NotificationType } from "@/lib/types";

const MAP: Record<NotificationType, { icon: typeof Bell; cls: string }> = {
  "donation:new": { icon: PackagePlus, cls: "bg-primary-soft text-primary" },
  "donation:claimed": { icon: HandHeart, cls: "bg-info-soft text-info" },
  "donation:collected": { icon: PackageCheck, cls: "bg-success-soft text-success" },
  "donation:cancelled": { icon: XCircle, cls: "bg-destructive-soft text-destructive" },
  "ngo:verified": { icon: BadgeCheck, cls: "bg-success-soft text-success" },
  "ngo:rejected": { icon: ShieldAlert, cls: "bg-destructive-soft text-destructive" },
  "ngo:registered": { icon: UserPlus, cls: "bg-warm-soft text-warm" },
};

type Bell = typeof PackagePlus;

export function NotificationIcon({ type }: { type: NotificationType }) {
  const { icon: Icon, cls } = MAP[type] ?? MAP["donation:new"];
  return (
    <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${cls}`}>
      <Icon className="size-4" />
    </span>
  );
}
