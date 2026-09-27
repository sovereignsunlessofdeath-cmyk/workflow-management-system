import {
  Bell,
  CheckCheck,
  ChevronRight,
  Clock3,
  Filter,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import Header from "../components/layout/Header";

import {
  useNotifications,
} from "../context/NotificationContext";

import type {
  NotificationItem,
  NotificationType,
} from "../api/notifications.api";

type ReadFilter =
  | "ALL"
  | "UNREAD"
  | "READ";

type TypeFilter =
  | "ALL"
  | NotificationType;

function formatLabel(
  value: string,
) {
  return value
    .toLowerCase()
    .replaceAll(
      "_",
      " ",
    )
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase(),
    );
}

function getNotificationTarget(
  notification: NotificationItem,
) {
  if (
    notification.task_id
  ) {
    return `/tasks/${notification.task_id}`;
  }

  if (
    notification.approval_id
  ) {
    return "/approvals";
  }

  if (
    notification.workflow_id
  ) {
    return `/workflows/${notification.workflow_id}`;
  }

  return null;
}

function typeClasses(
  type: NotificationType,
) {
  if (
    type.includes(
      "APPROVED",
    ) ||
    type.includes(
      "COMPLETED",
    )
  ) {
    return "border-emerald-100 bg-emerald-50 text-emerald-700";
  }

  if (
    type.includes(
      "REJECTED",
    ) ||
    type.includes(
      "OVERDUE",
    ) ||
    type.includes(
      "ARCHIVED",
    )
  ) {
    return "border-red-100 bg-red-50 text-red-700";
  }

  if (
    type.includes(
      "APPROVAL",
    )
  ) {
    return "border-amber-100 bg-amber-50 text-amber-700";
  }

  if (
    type.includes(
      "WORKFLOW",
    )
  ) {
    return "border-violet-100 bg-violet-50 text-violet-700";
  }

  return "border-blue-100 bg-blue-50 text-blue-700";
}

export default function NotificationsPage() {
  const navigate =
    useNavigate();

  const {
    notifications,
    unreadCount,
    connected,
    loading,
    refreshNotifications,
    markRead,
    markAllRead,
  } =
    useNotifications();

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    readFilter,
    setReadFilter,
  ] =
    useState<ReadFilter>(
      "ALL",
    );

  const [
    typeFilter,
    setTypeFilter,
  ] =
    useState<TypeFilter>(
      "ALL",
    );

  const [
    actionError,
    setActionError,
  ] =
    useState("");

  const readCount =
    notifications.length -
    unreadCount;

  const types =
    useMemo(
      () =>
        [
          ...new Set(
            notifications.map(
              (
                notification,
              ) =>
                notification.notification_type,
            ),
          ),
        ].sort(),
      [notifications],
    );

  const filteredNotifications =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return notifications.filter(
        (
          notification,
        ) => {
          const readMatches =
            readFilter ===
              "ALL" ||
            (
              readFilter ===
                "UNREAD" &&
              !notification.is_read
            ) ||
            (
              readFilter ===
                "READ" &&
              notification.is_read
            );

          const typeMatches =
            typeFilter ===
              "ALL" ||
            notification.notification_type ===
              typeFilter;

          const searchMatches =
            !query ||
            notification.title
              .toLowerCase()
              .includes(
                query,
              ) ||
            notification.message
              .toLowerCase()
              .includes(
                query,
              ) ||
            notification.notification_type
              .toLowerCase()
              .includes(
                query,
              );

          return (
            readMatches &&
            typeMatches &&
            searchMatches
          );
        },
      );
    }, [
      notifications,
      readFilter,
      typeFilter,
      search,
    ]);

  async function handleNotificationClick(
    notification:
      NotificationItem,
  ) {
    try {
      setActionError("");

      if (
        !notification.is_read
      ) {
        await markRead(
          notification.id,
        );
      }

      const target =
        getNotificationTarget(
          notification,
        );

      if (target) {
        navigate(
          target,
        );
      }
    } catch (error) {
      console.error(
        "Unable to open notification:",
        error,
      );

      setActionError(
        "Unable to update this notification.",
      );
    }
  }

  async function handleMarkAllRead() {
    try {
      setActionError("");

      await markAllRead();
    } catch (error) {
      console.error(
        "Unable to mark all notifications as read:",
        error,
      );

      setActionError(
        "Unable to mark all notifications as read.",
      );
    }
  }

  async function handleRefresh() {
    try {
      setActionError("");

      await refreshNotifications();
    } catch (error) {
      console.error(
        "Unable to refresh notifications:",
        error,
      );

      setActionError(
        "Unable to refresh notifications.",
      );
    }
  }

  return (
    <>
      <Header
        title="Notifications"
        subtitle="Review current and past workflow activity"
      />

      <div className="space-y-5 p-4 md:p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs text-slate-400">
              Total
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-800">
              {
                notifications.length
              }
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs text-slate-400">
              Unread
            </p>

            <p className="mt-1 text-2xl font-bold text-blue-600">
              {
                unreadCount
              }
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs text-slate-400">
              Read
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-800">
              {
                readCount
              }
            </p>
          </div>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_180px_220px_auto_auto]">
            <div className="relative">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="search"
                value={search}
                onChange={(
                  event,
                ) =>
                  setSearch(
                    event.target
                      .value,
                  )
                }
                placeholder="Search notifications..."
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-400"
              />
            </div>

            <select
              value={
                readFilter
              }
              onChange={(
                event,
              ) =>
                setReadFilter(
                  event.target
                    .value as ReadFilter,
                )
              }
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 outline-none transition focus:border-blue-400"
            >
              <option value="ALL">
                All
              </option>

              <option value="UNREAD">
                Unread
              </option>

              <option value="READ">
                Read
              </option>
            </select>

            <div className="relative">
              <Filter
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <select
                value={
                  typeFilter
                }
                onChange={(
                  event,
                ) =>
                  setTypeFilter(
                    event.target
                      .value as TypeFilter,
                  )
                }
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-600 outline-none transition focus:border-blue-400"
              >
                <option value="ALL">
                  All Types
                </option>

                {types.map(
                  (
                    type,
                  ) => (
                    <option
                      key={
                        type
                      }
                      value={
                        type
                      }
                    >
                      {formatLabel(
                        type,
                      )}
                    </option>
                  ),
                )}
              </select>
            </div>

            <button
              type="button"
              disabled={
                unreadCount ===
                0
              }
              onClick={() =>
                void handleMarkAllRead()
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckCheck
                size={16}
              />

              Mark all read
            </button>

            <button
              type="button"
              disabled={
                loading
              }
              onClick={() =>
                void handleRefresh()
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={
                  loading
                    ? "animate-spin"
                    : ""
                }
              />

              Refresh
            </button>
          </div>

          <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
            <span
              className={`h-2 w-2 rounded-full ${
                connected
                  ? "bg-emerald-500"
                  : "bg-slate-400"
              }`}
            />

            {connected
              ? "Realtime updates connected"
              : "Realtime updates disconnected"}
          </div>
        </section>

        {actionError && (
          <div className="flex items-center justify-between rounded-xl border border-red-100 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-700">
              {
                actionError
              }
            </p>

            <button
              type="button"
              onClick={() =>
                setActionError(
                  "",
                )
              }
              className="text-red-400 hover:text-red-600"
            >
              <X
                size={16}
              />
            </button>
          </div>
        )}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {loading &&
          notifications.length ===
            0 ? (
            <div className="space-y-3 p-5">
              {[
                1,
                2,
                3,
                4,
              ].map(
                (
                  item,
                ) => (
                  <div
                    key={
                      item
                    }
                    className="h-24 animate-pulse rounded-xl bg-slate-100"
                  />
                ),
              )}
            </div>
          ) : filteredNotifications.length ===
            0 ? (
            <div className="flex min-h-80 items-center justify-center p-8 text-center">
              <div>
                <Bell
                  size={40}
                  className="mx-auto text-slate-300"
                />

                <h2 className="mt-4 text-lg font-semibold text-slate-700">
                  No notifications found
                </h2>

                <p className="mt-2 text-sm text-slate-400">
                  Notifications matching your current filters will appear here.
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredNotifications.map(
                (
                  notification,
                ) => {
                  const target =
                    getNotificationTarget(
                      notification,
                    );

                  return (
                    <button
                      key={
                        notification.id
                      }
                      type="button"
                      onClick={() =>
                        void handleNotificationClick(
                          notification,
                        )
                      }
                      className={`flex w-full items-start gap-4 p-5 text-left transition hover:bg-slate-50 ${
                        notification.is_read
                          ? "bg-white"
                          : "bg-blue-50/60"
                      }`}
                    >
                      <span
                        className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full ${
                          notification.is_read
                            ? "bg-slate-300"
                            : "bg-blue-500"
                        }`}
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-bold text-slate-800">
                            {
                              notification.title
                            }
                          </p>

                          <span
                            className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${typeClasses(
                              notification.notification_type,
                            )}`}
                          >
                            {formatLabel(
                              notification.notification_type,
                            )}
                          </span>

                          {!notification.is_read && (
                            <span className="rounded-full bg-blue-600 px-2 py-1 text-[10px] font-semibold text-white">
                              Unread
                            </span>
                          )}
                        </div>

                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {
                            notification.message
                          }
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                          <span className="inline-flex items-center gap-1">
                            <Clock3
                              size={
                                12
                              }
                            />

                            {new Date(
                              notification.created_at,
                            ).toLocaleString()}
                          </span>

                          {notification.read_at && (
                            <span>
                              Read{" "}
                              {new Date(
                                notification.read_at,
                              ).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>

                      {target && (
                        <ChevronRight
                          size={
                            18
                          }
                          className="mt-2 shrink-0 text-slate-300"
                        />
                      )}
                    </button>
                  );
                },
              )}
            </div>
          )}
        </section>
      </div>
    </>
  );
}