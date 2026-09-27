import {
  WMSSocket,
  type SocketMessage,
} from "./websocket-client";

import type {
  NotificationItem,
} from "../api/notifications.api";

type WebSocketNotification = {
  id: string;
  notification_type:
    NotificationItem["notification_type"];
  title: string;
  message: string;

  task_id: string | null;
  workflow_id: string | null;
  approval_id: string | null;

  metadata: Record<string, unknown>;

  is_read: boolean;

  created_at: string;
};

type NotificationSocketOptions = {
  onConnected?: (
    data: SocketMessage,
  ) => void;

  onNotification?: (
    notification: NotificationItem,
  ) => void;

  onError?: (
    message: string,
  ) => void;
};

function normalizeSocketNotification(
  notification: WebSocketNotification,
): NotificationItem {
  return {
    ...notification,

    metadata:
      notification.metadata ?? {},

    read_at: null,
  };
}

export function createNotificationSocket({
  onConnected,
  onNotification,
  onError,
}: NotificationSocketOptions) {
  const socket = new WMSSocket({
    path: "/ws/notifications/",

    onMessage(data) {
      switch (data.type) {
        case "connection":
          onConnected?.(data);
          break;

        case "notification": {
          const notification =
            data.notification as WebSocketNotification;

          onNotification?.(
            normalizeSocketNotification(
              notification,
            ),
          );

          break;
        }

        case "error":
          onError?.(
            String(data.message),
          );
          break;

        case "pong":
          break;

        default:
          console.debug(
            "Unknown notification event:",
            data,
          );
      }
    },
  });

  return {
    connect() {
      socket.connect();
    },

    disconnect() {
      socket.disconnect();
    },

    ping() {
      return socket.send({
        type: "ping",
      });
    },

    isConnected() {
      return socket.isConnected();
    },
  };
}