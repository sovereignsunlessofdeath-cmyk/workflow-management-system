import api from "./axios";

export type NotificationType =
  | "TASK_ASSIGNED"
  | "TASK_STATUS_CHANGED"
  | "TASK_COMPLETED"
  | "APPROVAL_REQUESTED"
  | "APPROVAL_APPROVED"
  | "APPROVAL_REJECTED"
  | "TASK_APPROACHING_DUE"
  | "TASK_OVERDUE"
  | "WORKFLOW_CREATED"
  | "WORKFLOW_COMPLETED"
  | "WORKFLOW_ARCHIVED";

export type NotificationItem = {
  id: string;

  notification_type: NotificationType;

  title: string;

  message: string;

  task_id: string | null;

  workflow_id: string | null;

  approval_id: string | null;

  metadata: Record<string, unknown>;

  is_read: boolean;

  read_at: string | null;

  created_at: string;
};

type RestNotification = {
  id: string;
  notification_type: NotificationType;
  title: string;
  message: string;

  task: string | null;
  workflow: string | null;
  approval: string | null;

  metadata: Record<string, unknown>;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
};

type NotificationListResponse =
  | RestNotification[]
  | {
      results: RestNotification[];
      count?: number;
      next?: string | null;
      previous?: string | null;
    };

export function normalizeRestNotification(
  notification: RestNotification,
): NotificationItem {
  return {
    id: notification.id,
    notification_type:
      notification.notification_type,
    title: notification.title,
    message: notification.message,

    task_id: notification.task,
    workflow_id:
      notification.workflow,
    approval_id:
      notification.approval,

    metadata:
      notification.metadata ?? {},

    is_read: notification.is_read,
    read_at: notification.read_at,
    created_at:
      notification.created_at,
  };
}

export async function getNotifications() {
  const response =
    await api.get<NotificationListResponse>(
      "/notifications/",
    );

  const data = response.data;

  const notifications =
    Array.isArray(data)
      ? data
      : data.results;

  return notifications.map(
    normalizeRestNotification,
  );
}

export async function getUnreadCount() {
  const response = await api.get<{
    unread_count: number;
  }>(
    "/notifications/unread-count/",
  );

  return response.data.unread_count;
}

export async function markNotificationRead(
  notificationId: string,
) {
  const response =
    await api.post<RestNotification>(
      `/notifications/${notificationId}/read/`,
    );

  return normalizeRestNotification(
    response.data,
  );
}

export async function markAllNotificationsRead() {
  const response = await api.post<{
    detail: string;
    updated: number;
  }>("/notifications/read-all/");

  return response.data;
}