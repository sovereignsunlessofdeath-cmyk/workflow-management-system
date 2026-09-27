import {
  Activity,
  ChevronRight,
  Clock3,
  FileClock,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Header from "../components/layout/Header";

import { useAuth } from "../context/AuthContext";

import {
  getAuditLogs,
  type AuditLogItem,
} from "../api/audit.api";

type FilterValue =
  | "ALL"
  | string;

function formatLabel(
  value: string,
) {
  if (!value) {
    return "—";
  }

  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
}

function formatDate(
  value: string,
) {
  return new Date(
    value,
  ).toLocaleString();
}

function actionClasses(
  action: string,
) {
  if (
    action.includes(
      "APPROVED",
    )
  ) {
    return "border-emerald-100 bg-emerald-50 text-emerald-700";
  }

  if (
    action.includes(
      "REJECTED",
    ) ||
    action.includes(
      "CANCELLED",
    ) ||
    action.includes(
      "DEACTIVATED",
    )
  ) {
    return "border-red-100 bg-red-50 text-red-700";
  }

  if (
    action.includes(
      "CREATED",
    ) ||
    action ===
      "LOGIN"
  ) {
    return "border-blue-100 bg-blue-50 text-blue-700";
  }

  if (
    action.includes(
      "UPDATED",
    ) ||
    action.includes(
      "ASSIGNED",
    )
  ) {
    return "border-violet-100 bg-violet-50 text-violet-700";
  }

  if (
    action.includes(
      "COMPLETED",
    )
  ) {
    return "border-cyan-100 bg-cyan-50 text-cyan-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-600";
}

function JsonPanel({
  title,
  value,
}: {
  title: string;
  value:
    | Record<
        string,
        unknown
      >
    | null;
}) {
  if (
    !value ||
    Object.keys(value)
      .length === 0
  ) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {title}
        </p>

        <p className="mt-2 text-sm text-slate-400">
          No data recorded.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-950 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {title}
      </p>

      <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words text-xs leading-6 text-slate-200">
        {JSON.stringify(
          value,
          null,
          2,
        )}
      </pre>
    </div>
  );
}

export default function AuditLogPage() {
  const { user } =
    useAuth();

  const [
    auditLogs,
    setAuditLogs,
  ] =
    useState<
      AuditLogItem[]
    >([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    actionFilter,
    setActionFilter,
  ] =
    useState<FilterValue>(
      "ALL",
    );

  const [
    targetFilter,
    setTargetFilter,
  ] =
    useState<FilterValue>(
      "ALL",
    );

  const [
    selectedLog,
    setSelectedLog,
  ] =
    useState<
      AuditLogItem | null
    >(null);

  const loadAuditLogs =
    useCallback(
      async () => {
        if (
          user?.role !==
          "ADMINISTRATOR"
        ) {
          setAuditLogs([]);
          setLoading(false);

          return;
        }

        try {
          setLoading(true);
          setError("");

          const result =
            await getAuditLogs();

          setAuditLogs(
            result,
          );
        } catch (err) {
          console.error(
            "Unable to load audit logs:",
            err,
          );

          setError(
            "Unable to load audit logs.",
          );
        } finally {
          setLoading(false);
        }
      },
      [user?.role],
    );

  useEffect(() => {
    void loadAuditLogs();
  }, [loadAuditLogs]);

  const actions =
    useMemo(() => {
      return [
        ...new Set(
          auditLogs
            .map(
              (item) =>
                item.action,
            )
            .filter(Boolean),
        ),
      ].sort();
    }, [auditLogs]);

  const targetTypes =
    useMemo(() => {
      return [
        ...new Set(
          auditLogs
            .map(
              (item) =>
                item.target_type,
            )
            .filter(Boolean),
        ),
      ].sort();
    }, [auditLogs]);

  const filteredLogs =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return auditLogs.filter(
        (log) => {
          const matchesAction =
            actionFilter ===
              "ALL" ||
            log.action ===
              actionFilter;

          const matchesTarget =
            targetFilter ===
              "ALL" ||
            log.target_type ===
              targetFilter;

          const matchesSearch =
            !query ||
            log.action
              .toLowerCase()
              .includes(query) ||
            log.description
              .toLowerCase()
              .includes(query) ||
            (
              log.actor_email ??
              ""
            )
              .toLowerCase()
              .includes(query) ||
            log.target_type
              .toLowerCase()
              .includes(query) ||
            log.target_id
              .toLowerCase()
              .includes(query) ||
            (
              log.ip_address ??
              ""
            )
              .toLowerCase()
              .includes(query);

          return (
            matchesAction &&
            matchesTarget &&
            matchesSearch
          );
        },
      );
    }, [
      auditLogs,
      search,
      actionFilter,
      targetFilter,
    ]);

  const approvalEvents =
    useMemo(
      () =>
        auditLogs.filter(
          (log) =>
            log.action.startsWith(
              "APPROVAL_",
            ),
        ).length,
      [auditLogs],
    );

  const taskEvents =
    useMemo(
      () =>
        auditLogs.filter(
          (log) =>
            log.action.startsWith(
              "TASK_",
            ),
        ).length,
      [auditLogs],
    );

  const userEvents =
    useMemo(
      () =>
        auditLogs.filter(
          (log) =>
            log.action.startsWith(
              "USER_",
            ) ||
            log.action ===
              "LOGIN" ||
            log.action ===
              "LOGOUT",
        ).length,
      [auditLogs],
    );

  if (
    user?.role !==
    "ADMINISTRATOR"
  ) {
    return (
      <>
        <Header
          title="Audit Log"
          subtitle="System activity and security history"
        />

        <div className="p-4 md:p-6">
          <div className="flex min-h-96 items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="max-w-md">
              <ShieldCheck
                size={42}
                className="mx-auto text-slate-300"
              />

              <h2 className="mt-4 text-lg font-bold text-slate-800">
                Administrator access required
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Audit logs contain security and system activity records and are available only to administrators.
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header
        title="Audit Log"
        subtitle="Review system activity and security history"
      />

      <div className="space-y-5 p-4 md:p-6">
        {/* SUMMARY */}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <FileClock
                  size={19}
                />
              </div>

              <div>
                <p className="text-xs text-slate-400">
                  Total Events
                </p>

                <p className="text-2xl font-bold text-slate-800">
                  {
                    auditLogs.length
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
                <Activity
                  size={19}
                />
              </div>

              <div>
                <p className="text-xs text-slate-400">
                  Task Events
                </p>

                <p className="text-2xl font-bold text-slate-800">
                  {
                    taskEvents
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <ShieldCheck
                  size={19}
                />
              </div>

              <div>
                <p className="text-xs text-slate-400">
                  Approval Events
                </p>

                <p className="text-2xl font-bold text-slate-800">
                  {
                    approvalEvents
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <UserRound
                  size={19}
                />
              </div>

              <div>
                <p className="text-xs text-slate-400">
                  User Events
                </p>

                <p className="text-2xl font-bold text-slate-800">
                  {
                    userEvents
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FILTERS */}

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[1fr_220px_220px_auto]">
            <div className="relative">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target
                      .value,
                  )
                }
                placeholder="Search audit logs..."
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-400"
              />
            </div>

            <select
              value={
                actionFilter
              }
              onChange={(event) =>
                setActionFilter(
                  event.target
                    .value,
                )
              }
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 outline-none transition focus:border-blue-400"
            >
              <option value="ALL">
                All Actions
              </option>

              {actions.map(
                (action) => (
                  <option
                    key={
                      action
                    }
                    value={
                      action
                    }
                  >
                    {formatLabel(
                      action,
                    )}
                  </option>
                ),
              )}
            </select>

            <select
              value={
                targetFilter
              }
              onChange={(event) =>
                setTargetFilter(
                  event.target
                    .value,
                )
              }
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 outline-none transition focus:border-blue-400"
            >
              <option value="ALL">
                All Targets
              </option>

              {targetTypes.map(
                (target) => (
                  <option
                    key={
                      target
                    }
                    value={
                      target
                    }
                  >
                    {formatLabel(
                      target,
                    )}
                  </option>
                ),
              )}
            </select>

            <button
              type="button"
              onClick={() =>
                void loadAuditLogs()
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              <RefreshCw
                size={15}
              />

              Refresh
            </button>
          </div>
        </section>

        {/* ERROR */}

        {error && (
          <div className="flex items-center justify-between rounded-xl border border-red-100 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
              className="text-red-400 hover:text-red-600"
            >
              <X
                size={16}
              />
            </button>
          </div>
        )}

        {/* LIST */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="space-y-3 p-5">
              {[
                1,
                2,
                3,
                4,
              ].map(
                (item) => (
                  <div
                    key={item}
                    className="h-20 animate-pulse rounded-xl bg-slate-100"
                  />
                ),
              )}
            </div>
          ) : filteredLogs.length ===
            0 ? (
            <div className="flex min-h-80 items-center justify-center p-8 text-center">
              <div>
                <FileClock
                  size={38}
                  className="mx-auto text-slate-300"
                />

                <h2 className="mt-4 text-lg font-semibold text-slate-700">
                  No audit logs found
                </h2>

                <p className="mt-2 text-sm text-slate-400">
                  System activity will appear here when recorded.
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredLogs.map(
                (log) => (
                  <button
                    key={
                      log.id
                    }
                    type="button"
                    onClick={() =>
                      setSelectedLog(
                        log,
                      )
                    }
                    className="flex w-full items-start gap-4 p-5 text-left transition hover:bg-slate-50"
                  >
                    <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                      <Activity
                        size={17}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${actionClasses(
                            log.action,
                          )}`}
                        >
                          {formatLabel(
                            log.action,
                          )}
                        </span>

                        {log.target_type && (
                          <span className="text-xs font-medium text-slate-400">
                            {formatLabel(
                              log.target_type,
                            )}
                          </span>
                        )}
                      </div>

                      <p className="mt-2 text-sm font-medium text-slate-700">
                        {
                          log.description
                        }
                      </p>

                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                        <span>
                          {log.actor_email ||
                            "System"}
                        </span>

                        <span className="inline-flex items-center gap-1">
                          <Clock3
                            size={
                              12
                            }
                          />

                          {formatDate(
                            log.created_at,
                          )}
                        </span>

                        {log.ip_address && (
                          <span>
                            {
                              log.ip_address
                            }
                          </span>
                        )}
                      </div>
                    </div>

                    <ChevronRight
                      size={18}
                      className="mt-2 shrink-0 text-slate-300"
                    />
                  </button>
                ),
              )}
            </div>
          )}
        </section>
      </div>

      {/* DETAIL MODAL */}

      {selectedLog && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-100 bg-white px-5 py-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-800">
                    Audit Event
                  </h2>

                  <span
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${actionClasses(
                      selectedLog.action,
                    )}`}
                  >
                    {formatLabel(
                      selectedLog.action,
                    )}
                  </span>
                </div>

                <p className="mt-1 text-xs text-slate-400">
                  {formatDate(
                    selectedLog.created_at,
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedLog(
                    null,
                  )
                }
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100"
              >
                <X
                  size={18}
                />
              </button>
            </div>

            <div className="space-y-5 p-5">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Description
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {
                    selectedLog.description
                  }
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <p className="text-xs text-slate-400">
                    Actor
                  </p>

                  <p className="mt-1 break-all text-sm font-semibold text-slate-700">
                    {selectedLog.actor_email ||
                      "System"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">
                    Target Type
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-700">
                    {formatLabel(
                      selectedLog.target_type,
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">
                    Target ID
                  </p>

                  <p className="mt-1 break-all text-sm font-semibold text-slate-700">
                    {selectedLog.target_id ||
                      "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">
                    IP Address
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-700">
                    {selectedLog.ip_address ||
                      "—"}
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <p className="text-xs text-slate-400">
                    User Agent
                  </p>

                  <p className="mt-1 break-words text-sm font-semibold text-slate-700">
                    {selectedLog.user_agent ||
                      "—"}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <JsonPanel
                  title="Before"
                  value={
                    selectedLog.before
                  }
                />

                <JsonPanel
                  title="After"
                  value={
                    selectedLog.after
                  }
                />
              </div>

              <JsonPanel
                title="Metadata"
                value={
                  selectedLog.metadata
                }
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}