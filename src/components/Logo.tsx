import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8", className)} aria-hidden>
      <rect width="32" height="32" rx="10" className="fill-primary" />
      <path
        d="M7 20c3-5 6-7.5 9-7.5S22 15 25 20"
        className="stroke-primary-foreground"
        strokeWidth="2.4"
        fill="none"
        strokeLinecap="round"
      />
      <path d="M7 20v3M25 20v3M16 12.5V23" className="stroke-primary-foreground" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="16" cy="8.5" r="2.5" className="fill-warm" />
    </svg>
  );
}

export function Logo({ to = "/", className }: { to?: "/" | "/donor" | "/ngo" | "/admin"; className?: string }) {
  return (
    <Link to={to} className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="font-display text-xl font-semibold tracking-tight text-primary-deep">FoodBridge</span>
    </Link>
  );
}
