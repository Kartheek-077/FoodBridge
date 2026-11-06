import { useEffect, useState } from "react";
import { Timer } from "lucide-react";
import { formatTimeLeft, isExpiringSoon } from "@/lib/donation-utils";
import { cn } from "@/lib/utils";

/** Live countdown to a donation's expiry. Renders a neutral placeholder until mounted. */
export function Countdown({ expiresAt, className }: { expiresAt: string; className?: string }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (now === null)
    return <span className={cn("inline-flex h-6 w-24 animate-pulse rounded-full bg-muted", className)} />;

  const expired = new Date(expiresAt).getTime() <= now;
  const soon = isExpiringSoon(expiresAt, now);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums",
        expired ? "bg-muted text-muted-foreground" : soon ? "bg-warm-soft text-warm" : "bg-primary-soft text-primary-deep",
        className,
      )}
    >
      <Timer className="size-3.5" />
      {formatTimeLeft(expiresAt, now)}
    </span>
  );
}
