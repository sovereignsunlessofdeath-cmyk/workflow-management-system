import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  useAuth,
} from "./AuthContext";

import {
  useSettings,
} from "./SettingsContext";

import {
  getNotifications,
  getUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
} from "../api/notifications.api";

import {
  createNotificationSocket,
} from "../websockets/notifications.socket";

type NotificationContextValue = {
  notifications: NotificationItem[];
  unreadCount: number;
  connected: boolean;
  loading: boolean;

  refreshNotifications: () => Promise<void>;

  markRead: (
    notificationId: string,
  ) => Promise<void>;

  markAllRead: () => Promise<void>;
};

const NotificationContext =
  createContext<
    NotificationContextValue | undefined
  >(undefined);

type NotificationProviderProps = {
  children: ReactNode;
};

export function NotificationProvider({
  children,
}: NotificationProviderProps) {
  const {
    isAuthenticated,
  } =
    useAuth();

  const {
    settings,
  } =
    useSettings();

  const [
    notifications,
    setNotifications,
  ] =
    useState<
      NotificationItem[]
    >([]);

  const [
    unreadCount,
    setUnreadCount,
  ] =
    useState(0);

  const [
    connected,
    setConnected,
  ] =
    useState(false);

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const refreshNotifications =
    useCallback(
      async () => {
        if (
          !isAuthenticated
        ) {
          return;
        }

        try {
          setLoading(
            true,
          );

          const [
            notificationList,
            unread,
          ] =
            await Promise.all([
              getNotifications(),
              getUnreadCount(),
            ]);

          setNotifications(
            notificationList,
          );

          setUnreadCount(
            unread,
          );
        } catch (error) {
          console.error(
            "Unable to load notifications:",
            error,
          );
        } finally {
          setLoading(
            false,
          );
        }
      },
      [isAuthenticated],
    );

  useEffect(() => {
    if (
      !isAuthenticated
    ) {
      setNotifications(
        [],
      );

      setUnreadCount(
        0,
      );

      setConnected(
        false,
      );

      return;
    }

    void refreshNotifications();

    if (
      !settings.realtimeNotifications
    ) {
      setConnected(
        false,
      );

      return;
    }

    const socket =
      createNotificationSocket({
        onConnected() {
          setConnected(
            true,
          );
        },

        onNotification(
          notification,
        ) {
          setNotifications(
            (
              current,
            ) => {
              const exists =
                current.some(
                  (
                    item,
                  ) =>
                    item.id ===
                    notification.id,
                );

              if (
                exists
              ) {
                return current;
              }

              return [
                notification,
                ...current,
              ];
            },
          );

          if (
            !notification.is_read
          ) {
            setUnreadCount(
              (
                current,
              ) =>
                current +
                1,
            );
          }
        },

        onError(
          message,
        ) {
          console.error(
            "Notification socket error:",
            message,
          );
        },
      });

    socket.connect();

    const pingInterval =
      window.setInterval(
        () => {
          if (
            socket.isConnected()
          ) {
            socket.ping();
          }
        },
        30000,
      );

    return () => {
      window.clearInterval(
        pingInterval,
      );

      socket.disconnect();

      setConnected(
        false,
      );
    };
  }, [
    isAuthenticated,
    refreshNotifications,
    settings.realtimeNotifications,
  ]);

  async function markRead(
    notificationId: string,
  ) {
    const existing =
      notifications.find(
        (
          notification,
        ) =>
          notification.id ===
          notificationId,
      );

    if (
      !existing ||
      existing.is_read
    ) {
      return;
    }

    const updated =
      await markNotificationRead(
        notificationId,
      );

    setNotifications(
      (
        current,
      ) =>
        current.map(
          (
            notification,
          ) =>
            notification.id ===
            notificationId
              ? updated
              : notification,
        ),
    );

    setUnreadCount(
      (
        current,
      ) =>
        Math.max(
          0,
          current - 1,
        ),
    );
  }

  async function markAllRead() {
    if (
      unreadCount === 0
    ) {
      return;
    }

    await markAllNotificationsRead();

    setNotifications(
      (
        current,
      ) =>
        current.map(
          (
            notification,
          ) => ({
            ...notification,
            is_read:
              true,
            read_at:
              notification.read_at ??
              new Date().toISOString(),
          }),
        ),
    );

    setUnreadCount(
      0,
    );
  }

  const value =
    useMemo(
      () => ({
        notifications,
        unreadCount,
        connected,
        loading,
        refreshNotifications,
        markRead,
        markAllRead,
      }),
      [
        notifications,
        unreadCount,
        connected,
        loading,
        refreshNotifications,
      ],
    );

  return (
    <NotificationContext.Provider
      value={value}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context =
    useContext(
      NotificationContext,
    );

  if (
    !context
  ) {
    throw new Error(
      "useNotifications must be used inside NotificationProvider.",
    );
  }

  return context;
}