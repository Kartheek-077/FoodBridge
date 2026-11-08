import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";
import { BellOff, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageHeader } from "@/components/PageHeader";
import { ListSkeleton } from "@/components/Skeletons";
import { EmptyState } from "@/components/EmptyState";
import { NotificationIcon } from "@/components/NotificationIcon";
import { useNotifications } from "@/context/NotificationContext";
import type { AppNotification } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — FoodBridge" },
      { name: "description", content: "Real-time updates on donations, claims, pickups and verification." },
      { property: "og:title", content: "Notifications — FoodBridge" },
      { property: "og:description", content: "Real-time updates on donations, claims and pickups." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <ProtectedRoute>
      <NotificationsPage />
    </ProtectedRoute>
  ),
});

function dayLabel(iso: string) {
  const d = new Date(iso);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "EEEE, d MMM");
}

function NotificationsPage() {
  const { notifications, unreadCount, markRead, markAllRead, isLoading } = useNotifications();
  const [onlyUnread, setOnlyUnread] = useState(false);
  const navigate = useNavigate();

  const list = onlyUnread ? notifications.filter((n) => !n.read) : notifications;
  const groups = list.reduce<Record<string, AppNotification[]>>((acc, n) => {
    const k = dayLabel(n.createdAt);
    (acc[k] ??= []).push(n);
    return acc;
  }, {});

  return (
    <div className="container-page max-w-3xl py-8 sm:py-10">
      <PageHeader
        title="Notifications"
        description={unreadCount ? `${unreadCount} unread` : "You're all caught up."}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => setOnlyUnread((v) => !v)}>
              {onlyUnread ? "Show all" : "Unread only"}
            </Button>
            {unreadCount > 0 && (
              <Button size="sm" variant="soft" onClick={markAllRead}>
                <CheckCheck /> Mark all read
              </Button>
            )}
          </>
        }
      />
      {isLoading ? (
        <ListSkeleton />
      ) : list.length === 0 ? (
        <EmptyState
          icon={BellOff}
          title={onlyUnread ? "No unread notifications" : "No notifications yet"}
          description="Updates about donations, claims and pickups will appear here in real time."
        />
      ) : (
        <div className="space-y-8">
          {Object.entries(groups).map(([day, items]) => (
            <section key={day}>
              <h2 className="mb-3 font-sans text-xs font-bold uppercase tracking-wider text-muted-foreground">{day}</h2>
              <ul className="overflow-hidden rounded-2xl border bg-card shadow-soft">
                {items.map((n) => (
                  <li key={n.id} className="border-b last:border-0">
                    <button
                      onClick={() => {
                        if (!n.read) markRead(n.id);
                        if (n.donationId) void navigate({ to: "/donations/$id", params: { id: n.donationId } });
                      }}
                      className={cn("flex w-full gap-4 p-4 text-left hover:bg-muted", !n.read && "bg-primary-soft/40")}
                    >
                      <NotificationIcon type={n.type} />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{n.title}</p>
                        <p className="text-sm text-muted-foreground">{n.message}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      {!n.read && <span className="mt-2 size-2.5 shrink-0 rounded-full bg-warm" aria-label="Unread" />}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
