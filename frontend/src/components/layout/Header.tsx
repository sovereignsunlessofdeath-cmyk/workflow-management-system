import {
  Bell,
  CheckCheck,
  FileText,
  Search,
  UserRound,
  Workflow,
  X,
} from "lucide-react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  useAuth,
} from "../../context/AuthContext";

import {
  useNotifications,
} from "../../context/NotificationContext";

import {
  useSettings,
} from "../../context/SettingsContext";

import {
  getSearchTasks,
  getSearchWorkflows,
} from "../../api/search.api";

import type {
  WorkflowItem,
} from "../../api/workflows.api";

import type {
  WorkflowTask,
} from "../../api/workflow-details.api";


type HeaderProps = {
  title: string;
  subtitle?: string;
};


type SearchResult = {
  id: string;

  resultType:
    | "TASK"
    | "WORKFLOW"
    | "NOTIFICATION";

  title: string;

  description: string;

  path: string;
};


function formatLabel(
  value: string,
) {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (
        character,
      ) =>
        character.toUpperCase(),
    );
}


export default function Header({
  title,
  subtitle,
}: HeaderProps) {
  const navigate =
    useNavigate();

  const {
    user,
  } =
    useAuth();

  const {
    settings,
  } =
    useSettings();

  const {
    notifications,
    unreadCount,
    connected,
    loading,
    markRead,
    markAllRead,
  } =
    useNotifications();


  const [
    notificationOpen,
    setNotificationOpen,
  ] =
    useState(false);

  const [
    searchOpen,
    setSearchOpen,
  ] =
    useState(false);

  const [
    searchQuery,
    setSearchQuery,
  ] =
    useState("");

  const [
    tasks,
    setTasks,
  ] =
    useState<
      WorkflowTask[]
    >([]);

  const [
    workflows,
    setWorkflows,
  ] =
    useState<
      WorkflowItem[]
    >([]);

  const [
    searchLoading,
    setSearchLoading,
  ] =
    useState(false);

  const [
    searchLoaded,
    setSearchLoaded,
  ] =
    useState(false);

  const [
    searchError,
    setSearchError,
  ] =
    useState("");

  const [
    bellPulse,
    setBellPulse,
  ] =
    useState(false);


  const previousUnreadCount =
    useRef(
      unreadCount,
    );

  const searchContainerRef =
    useRef<
      HTMLDivElement | null
    >(null);

  const notificationContainerRef =
    useRef<
      HTMLDivElement | null
    >(null);


  useEffect(() => {
    if (
      unreadCount >
      previousUnreadCount.current
    ) {
      setBellPulse(
        true,
      );

      const timer =
        window.setTimeout(
          () => {
            setBellPulse(
              false,
            );
          },
          900,
        );

      previousUnreadCount.current =
        unreadCount;

      return () => {
        window.clearTimeout(
          timer,
        );
      };
    }

    previousUnreadCount.current =
      unreadCount;
  }, [unreadCount]);


  useEffect(() => {
    function handleOutsideClick(
      event: MouseEvent,
    ) {
      const target =
        event.target as Node;

      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(
          target,
        )
      ) {
        setSearchOpen(
          false,
        );
      }

      if (
        notificationContainerRef.current &&
        !notificationContainerRef.current.contains(
          target,
        )
      ) {
        setNotificationOpen(
          false,
        );
      }
    }


    document.addEventListener(
      "mousedown",
      handleOutsideClick,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick,
      );
    };
  }, []);


  async function loadSearchData() {
    if (
      searchLoaded ||
      searchLoading
    ) {
      return;
    }

    try {
      setSearchLoading(
        true,
      );

      setSearchError(
        "",
      );

      const canReadWorkflows =
        user?.role ===
          "ADMINISTRATOR" ||
        user?.role ===
          "MANAGER" ||
        user?.role ===
          "APPROVER";


      const [
        taskResults,
        workflowResults,
      ] =
        await Promise.all([
          getSearchTasks(),

          canReadWorkflows
            ? getSearchWorkflows()
            : Promise.resolve(
                [],
              ),
        ]);


      setTasks(
        taskResults,
      );

      setWorkflows(
        workflowResults,
      );

      setSearchLoaded(
        true,
      );
    } catch (error) {
      console.error(
        "Unable to load search data:",
        error,
      );

      setSearchError(
        "Unable to load search results.",
      );
    } finally {
      setSearchLoading(
        false,
      );
    }
  }


  const searchResults =
    useMemo<
      SearchResult[]
    >(() => {
      const query =
        searchQuery
          .trim()
          .toLowerCase();

      if (
        query.length <
        2
      ) {
        return [];
      }


      const taskResults:
        SearchResult[] =
        tasks
          .filter(
            (task) =>
              task.title
                .toLowerCase()
                .includes(
                  query,
                ) ||
              task.description
                .toLowerCase()
                .includes(
                  query,
                ) ||
              task.status
                .toLowerCase()
                .includes(
                  query,
                ) ||
              task.priority
                .toLowerCase()
                .includes(
                  query,
                ),
          )
          .map(
            (task) => ({
              id:
                task.id,

              resultType:
                "TASK",

              title:
                task.title,

              description:
                `${formatLabel(
                  task.status,
                )} • ${formatLabel(
                  task.priority,
                )}`,

              path:
                `/tasks/${task.id}`,
            }),
          );


      const workflowResults:
        SearchResult[] =
        workflows
          .filter(
            (
              workflow,
            ) =>
              workflow.name
                .toLowerCase()
                .includes(
                  query,
                ) ||
              workflow.description
                .toLowerCase()
                .includes(
                  query,
                ) ||
              workflow.status
                .toLowerCase()
                .includes(
                  query,
                ),
          )
          .map(
            (
              workflow,
            ) => ({
              id:
                workflow.id,

              resultType:
                "WORKFLOW",

              title:
                workflow.name,

              description:
                formatLabel(
                  workflow.status,
                ),

              path:
                `/workflows/${workflow.id}`,
            }),
          );


      const notificationResults:
        SearchResult[] =
        notifications
          .filter(
            (
              notification,
            ) =>
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
                ),
          )
          .map(
            (
              notification,
            ) => {
              let path =
                "/notifications";

              if (
                notification.task_id
              ) {
                path =
                  `/tasks/${notification.task_id}`;
              } else if (
                notification.approval_id
              ) {
                path =
                  "/approvals";
              } else if (
                notification.workflow_id
              ) {
                path =
                  `/workflows/${notification.workflow_id}`;
              }

              return {
                id:
                  notification.id,

                resultType:
                  "NOTIFICATION",

                title:
                  notification.title,

                description:
                  notification.message,

                path,
              };
            },
          );


      return [
        ...taskResults,
        ...workflowResults,
        ...notificationResults,
      ].slice(
        0,
        12,
      );
    }, [
      searchQuery,
      tasks,
      workflows,
      notifications,
    ]);


  function handleSearchFocus() {
    setSearchOpen(
      true,
    );

    setNotificationOpen(
      false,
    );

    void loadSearchData();
  }


  function clearSearch() {
    setSearchQuery(
      "",
    );

    setSearchOpen(
      false,
    );
  }


  function openSearchResult(
    result:
      SearchResult,
  ) {
    clearSearch();

    navigate(
      result.path,
    );
  }


  async function handleNotificationClick(
    notificationId: string,
    taskId: string | null,
    workflowId: string | null,
    approvalId: string | null,
  ) {
    try {
      await markRead(
        notificationId,
      );
    } catch (error) {
      console.error(
        "Unable to mark notification as read:",
        error,
      );
    }

    setNotificationOpen(
      false,
    );

    if (taskId) {
      navigate(
        `/tasks/${taskId}`,
      );

      return;
    }

    if (approvalId) {
      navigate(
        "/approvals",
      );

      return;
    }

    if (workflowId) {
      navigate(
        `/workflows/${workflowId}`,
      );
    }
  }


  function openNotificationPage() {
    setNotificationOpen(
      false,
    );

    navigate(
      "/notifications",
    );
  }


  const initials =
    user
      ? `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`
          .toUpperCase()
      : "";


  return (
    <header className="wms-header sticky top-0 z-30 flex min-h-18 items-center justify-between px-4 md:px-8">
      {/* PAGE TITLE */}

      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <div className="hidden h-9 w-1 rounded-full bg-gradient-to-b from-blue-500 via-cyan-400 to-violet-500 sm:block" />

          <div className="min-w-0">
            <h2 className="truncate text-xl font-bold tracking-tight text-slate-800 md:text-2xl">
              {title}
            </h2>

            {subtitle && (
              <p className="mt-0.5 truncate text-xs text-slate-500 md:text-sm">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>


      {/* RIGHT SIDE */}

      <div className="ml-4 flex items-center gap-2.5 md:gap-3">
        {/* GLOBAL SEARCH */}

        <div
          ref={
            searchContainerRef
          }
          className="relative hidden md:block"
        >
          <div className="group flex items-center gap-2 rounded-2xl border border-white/70 bg-white/60 px-3.5 py-2.5 shadow-sm backdrop-blur-xl transition duration-200 focus-within:border-blue-300/70 focus-within:bg-white/80 focus-within:shadow-md">
            <Search
              size={17}
              className="shrink-0 text-slate-400 transition group-focus-within:text-blue-500"
            />

            <input
              type="search"
              value={
                searchQuery
              }
              onFocus={
                handleSearchFocus
              }
              onChange={(
                event,
              ) => {
                setSearchQuery(
                  event.target
                    .value,
                );

                setSearchOpen(
                  true,
                );
              }}
              placeholder="Search WMS..."
              className="w-56 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />

            {searchQuery && (
              <button
                type="button"
                onClick={
                  clearSearch
                }
                className="rounded-md p-0.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X
                  size={14}
                />
              </button>
            )}
          </div>


          <AnimatePresence>
            {searchOpen && (
              <motion.div
                initial={{
                  opacity: 0,
                  y: -8,
                  scale: 0.98,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                }}
                exit={{
                  opacity: 0,
                  y: -8,
                  scale: 0.98,
                }}
                transition={{
                  duration: 0.16,
                }}
                className="wms-glass-strong absolute right-0 top-14 z-50 w-[420px] overflow-hidden rounded-3xl"
              >
                <div className="border-b border-slate-100 px-5 py-4">
                  <p className="text-sm font-semibold text-slate-800">
                    Search WMS
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Tasks, workflows and notifications
                  </p>
                </div>


                <div className="max-h-[420px] overflow-y-auto">
                  {searchLoading && (
                    <div className="space-y-3 p-4">
                      {[
                        1,
                        2,
                        3,
                      ].map(
                        (
                          item,
                        ) => (
                          <div
                            key={
                              item
                            }
                            className="h-16 animate-pulse rounded-2xl bg-slate-100"
                          />
                        ),
                      )}
                    </div>
                  )}


                  {!searchLoading &&
                    searchError && (
                      <div className="p-8 text-center">
                        <p className="text-sm text-red-600">
                          {
                            searchError
                          }
                        </p>

                        <button
                          type="button"
                          onClick={() => {
                            setSearchLoaded(
                              false,
                            );

                            void loadSearchData();
                          }}
                          className="mt-3 text-sm font-semibold text-blue-600"
                        >
                          Retry
                        </button>
                      </div>
                    )}


                  {!searchLoading &&
                    !searchError &&
                    searchQuery
                      .trim()
                      .length <
                      2 && (
                      <div className="px-6 py-12 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-500">
                          <Search
                            size={22}
                          />
                        </div>

                        <p className="mt-4 text-sm font-medium text-slate-600">
                          Start typing to search
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          Enter at least two characters.
                        </p>
                      </div>
                    )}


                  {!searchLoading &&
                    !searchError &&
                    searchQuery
                      .trim()
                      .length >=
                      2 &&
                    searchResults.length ===
                      0 && (
                      <div className="px-6 py-12 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                          <Search
                            size={22}
                          />
                        </div>

                        <p className="mt-4 text-sm font-medium text-slate-600">
                          No results found
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          Try another search term.
                        </p>
                      </div>
                    )}


                  {!searchLoading &&
                    searchResults.map(
                      (
                        result,
                      ) => (
                        <button
                          key={`${result.resultType}-${result.id}`}
                          type="button"
                          onClick={() =>
                            openSearchResult(
                              result,
                            )
                          }
                          className="group flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3.5 text-left transition last:border-b-0 hover:bg-blue-50/60"
                        >
                          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 text-slate-500 transition group-hover:border-blue-100 group-hover:bg-blue-50 group-hover:text-blue-600">
                            {result.resultType ===
                            "TASK" ? (
                              <FileText
                                size={17}
                              />
                            ) : result.resultType ===
                              "WORKFLOW" ? (
                              <Workflow
                                size={17}
                              />
                            ) : (
                              <Bell
                                size={17}
                              />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-sm font-semibold text-slate-800">
                                {
                                  result.title
                                }
                              </p>

                              <span className="shrink-0 rounded-full border border-slate-100 bg-slate-50 px-2 py-0.5 text-[9px] font-bold tracking-wide text-slate-500">
                                {
                                  result.resultType
                                }
                              </span>
                            </div>

                            <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-400">
                              {
                                result.description
                              }
                            </p>
                          </div>
                        </button>
                      ),
                    )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>


        {/* NOTIFICATIONS */}

        <div
          ref={
            notificationContainerRef
          }
          className="relative"
        >
          <motion.button
            type="button"
            onClick={() => {
              setSearchOpen(
                false,
              );

              setNotificationOpen(
                (
                  current,
                ) =>
                  !current,
              );
            }}
            animate={
              bellPulse
                ? {
                    rotate: [
                      0,
                      -12,
                      12,
                      -8,
                      8,
                      0,
                    ],
                  }
                : {
                    rotate: 0,
                  }
            }
            transition={{
              duration: 0.6,
            }}
            className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-white/70 bg-white/60 text-slate-500 shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white/85 hover:text-blue-600 hover:shadow-md"
          >
            <Bell
              size={18}
            />

            {settings.showNotificationBadges &&
              unreadCount >
                0 && (
                <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[9px] font-bold text-white shadow-sm">
                  {unreadCount >
                  99
                    ? "99+"
                    : unreadCount}
                </span>
              )}

            <span
              title={
                settings.realtimeNotifications
                  ? connected
                    ? "Realtime notifications connected"
                    : "Realtime notifications disconnected"
                  : "Realtime notifications disabled"
              }
              className={`absolute bottom-1 right-1 h-2.5 w-2.5 rounded-full border-2 border-white ${
                !settings.realtimeNotifications
                  ? "bg-slate-400"
                  : connected
                    ? "bg-emerald-500"
                    : "bg-red-400"
              }`}
            />
          </motion.button>


          <AnimatePresence>
            {notificationOpen && (
              <motion.div
                initial={{
                  opacity: 0,
                  y: -8,
                  scale: 0.98,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                }}
                exit={{
                  opacity: 0,
                  y: -8,
                  scale: 0.98,
                }}
                transition={{
                  duration: 0.18,
                }}
                className="wms-glass-strong absolute right-0 top-14 z-50 w-[360px] overflow-hidden rounded-3xl"
              >
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                  <div>
                    <h3 className="font-semibold text-slate-800">
                      Notifications
                    </h3>

                    <p className="mt-0.5 text-xs text-slate-400">
                      {!settings.realtimeNotifications
                        ? "Realtime updates disabled"
                        : connected
                          ? "Live updates connected"
                          : "Realtime connection unavailable"}
                    </p>
                  </div>


                  {unreadCount >
                    0 && (
                    <button
                      type="button"
                      onClick={() =>
                        void markAllRead()
                      }
                      className="flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-medium text-blue-600 transition hover:bg-blue-50 hover:text-blue-700"
                    >
                      <CheckCheck
                        size={14}
                      />

                      Mark all read
                    </button>
                  )}
                </div>


                <div className="max-h-[420px] overflow-y-auto">
                  {loading && (
                    <div className="space-y-3 p-4">
                      {[
                        1,
                        2,
                        3,
                      ].map(
                        (
                          item,
                        ) => (
                          <div
                            key={
                              item
                            }
                            className="animate-pulse rounded-2xl bg-slate-100 p-4"
                          >
                            <div className="h-3 w-32 rounded bg-slate-200" />

                            <div className="mt-3 h-2.5 w-full rounded bg-slate-200" />

                            <div className="mt-2 h-2.5 w-2/3 rounded bg-slate-200" />
                          </div>
                        ),
                      )}
                    </div>
                  )}


                  {!loading &&
                    notifications.length ===
                      0 && (
                      <div className="px-6 py-12 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-500">
                          <Bell
                            size={22}
                          />
                        </div>

                        <p className="mt-4 text-sm font-medium text-slate-600">
                          No notifications yet
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          New activity will appear here.
                        </p>
                      </div>
                    )}


                  {!loading &&
                    notifications
                      .slice(
                        0,
                        10,
                      )
                      .map(
                        (
                          notification,
                        ) => (
                          <button
                            key={
                              notification.id
                            }
                            type="button"
                            onClick={() =>
                              void handleNotificationClick(
                                notification.id,
                                notification.task_id,
                                notification.workflow_id,
                                notification.approval_id,
                              )
                            }
                            className={`group block w-full border-b border-slate-100 px-4 py-4 text-left transition last:border-b-0 hover:bg-blue-50/60 ${
                              notification.is_read
                                ? "bg-white"
                                : "bg-blue-50/70"
                            }`}
                          >
                            <div className="flex gap-3">
                              <span
                                className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full transition ${
                                  notification.is_read
                                    ? "bg-slate-300"
                                    : "bg-blue-500 shadow-[0_0_9px_rgba(59,130,246,0.45)]"
                                }`}
                              />

                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-slate-800">
                                  {
                                    notification.title
                                  }
                                </p>

                                <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                                  {
                                    notification.message
                                  }
                                </p>

                                <p className="mt-2 text-[11px] text-slate-400">
                                  {new Date(
                                    notification.created_at,
                                  ).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </button>
                        ),
                      )}
                </div>


                <div className="border-t border-slate-100 px-4 py-3 text-center">
                  <button
                    type="button"
                    onClick={
                      openNotificationPage
                    }
                    className="rounded-xl px-4 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50 hover:text-blue-700"
                  >
                    View all notifications
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>


        {/* USER */}

        <button
          type="button"
          className="group flex h-11 items-center gap-2.5 rounded-2xl border border-white/70 bg-white/60 p-1.5 pr-2 shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white/85 hover:shadow-md"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-violet-600 text-xs font-bold text-white shadow-md shadow-blue-500/20">
            {initials || (
              <UserRound
                size={17}
              />
            )}
          </div>

          <div className="hidden max-w-28 text-left xl:block">
            <p className="truncate text-xs font-semibold text-slate-700">
              {user?.first_name ||
                "Account"}
            </p>

            <p className="truncate text-[10px] font-medium text-slate-400">
              {user?.role
                ? formatLabel(
                    user.role,
                  )
                : "User"}
            </p>
          </div>
        </button>
      </div>
    </header>
  );
}