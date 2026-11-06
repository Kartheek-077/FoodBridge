import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { notificationsApi, getErrorMessage } from "@/lib/api";
import { connectSocket, SOCKET_EVENTS } from "@/lib/socket";
import type { AppNotification, SocketEventPayload } from "@/lib/types";
import { useAuth } from "./AuthContext";
import { getToastPreference } from "@/hooks/use-preferences";

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  markRead: (id: string) => void;
  markAllRead: () => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export const notificationsKey = ["notifications"] as const;

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { status, token, user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const enabled = status === "authenticated";

  const query = useQuery({
    queryKey: notificationsKey,
    queryFn: notificationsApi.list,
    enabled,
    refetchInterval: 60_000,
  });

  const refreshRef = useRef(refreshUser);
  refreshRef.current = refreshUser;

  // Real-time events
  useEffect(() => {
    if (!enabled || !token || !user) return;
    const socket = connectSocket(token, user.id);
    const handler = (payload: SocketEventPayload) => {
      const n = payload.notification;
      queryClient.setQueryData<AppNotification[]>(notificationsKey, (prev = []) =>
        prev.some((x) => x.id === n.id) ? prev : [n, ...prev],
      );
      void queryClient.invalidateQueries({ queryKey: ["donations"] });
      void queryClient.invalidateQueries({ queryKey: ["claims"] });
      void queryClient.invalidateQueries({ queryKey: ["admin"] });
      if (n.type === "ngo:verified" || n.type === "ngo:rejected") void refreshRef.current();
      if (getToastPreference()) {
        const show = n.type === "ngo:rejected" || n.type === "donation:cancelled" ? toast.warning : toast.success;
        show(n.title, { description: n.message });
      }
    };
    SOCKET_EVENTS.forEach((e) => socket.on(e, handler));
    return () => {
      SOCKET_EVENTS.forEach((e) => socket.off(e, handler));
      socket.disconnect();
    };
  }, [enabled, token, user?.id, queryClient]); // eslint-disable-line react-hooks/exhaustive-deps

  const markReadMutation = useMutation({
    mutationFn: notificationsApi.markRead,
    onMutate: async (id: string) => {
      queryClient.setQueryData<AppNotification[]>(notificationsKey, (prev = []) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
    },
    onError: (e) => {
      toast.error(getErrorMessage(e));
      void queryClient.invalidateQueries({ queryKey: notificationsKey });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onMutate: async () => {
      queryClient.setQueryData<AppNotification[]>(notificationsKey, (prev = []) =>
        prev.map((n) => ({ ...n, read: true })),
      );
    },
    onError: (e) => {
      toast.error(getErrorMessage(e));
      void queryClient.invalidateQueries({ queryKey: notificationsKey });
    },
  });

  const markRead = useCallback((id: string) => markReadMutation.mutate(id), [markReadMutation]);
  const markAllRead = useCallback(() => markAllMutation.mutate(), [markAllMutation]);

  const notifications = enabled ? (query.data ?? []) : [];
  const value = useMemo<NotificationContextValue>(
    () => ({
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
      isLoading: enabled && query.isLoading,
      markRead,
      markAllRead,
    }),
    [notifications, enabled, query.isLoading, markRead, markAllRead],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used inside <NotificationProvider>");
  return ctx;
}
