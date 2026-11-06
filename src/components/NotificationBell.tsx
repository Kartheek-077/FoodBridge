import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, CheckCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useNotifications } from "@/context/NotificationContext";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { NotificationIcon } from "./NotificationIcon";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead, isLoading } = useNotifications();
  const navigate = useNavigate();
  const recent = notifications.slice(0, 6);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full" aria-label={`Notifications, ${unreadCount} unread`}>
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-warm px-1 text-[10px] font-bold leading-5 text-warm-foreground ring-2 ring-background">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[22rem] rounded-2xl p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="font-semibold">Notifications</p>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
              <CheckCheck className="size-3.5" /> Mark all read
            </button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">Loading…</p>
          ) : recent.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">You're all caught up.</p>
          ) : (
            recent.map((n) => (
              <button
                key={n.id}
                onClick={() => {
                  if (!n.read) markRead(n.id);
                  if (n.donationId) void navigate({ to: "/donations/$id", params: { id: n.donationId } });
                }}
                className={cn(
                  "flex w-full gap-3 border-b px-4 py-3 text-left transition-colors last:border-0 hover:bg-muted",
                  !n.read && "bg-primary-soft/50",
                )}
              >
                <NotificationIcon type={n.type} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{n.title}</p>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{n.message}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </p>
                </div>
                {!n.read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-warm" />}
              </button>
            ))
          )}
        </div>
        <Link to="/notifications" className="block border-t px-4 py-3 text-center text-sm font-semibold text-primary hover:bg-muted">
          View all notifications
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
