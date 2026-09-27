import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  ListTodo,
  RefreshCw,
  Workflow,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import Header from "../components/layout/Header";

import {
  getDashboardSummary,
  getRecentActivity,
  getTaskStatistics,
  getWorkflowStatistics,
  type DashboardSummary,
  type RecentActivity,
  type TaskStatistics,
  type WorkflowStatistics,
} from "../api/dashboard.api";

type DashboardData = {
  summary: DashboardSummary;
  taskStatistics: TaskStatistics;
  workflows: WorkflowStatistics[];
  recentActivity: RecentActivity[];
};

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

export default function DashboardPage() {
  const navigate = useNavigate();

  const [data, setData] =
    useState<DashboardData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const loadDashboard =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const [
          summary,
          taskStatistics,
          workflows,
          recentActivity,
        ] = await Promise.all([
          getDashboardSummary(),
          getTaskStatistics(),
          getWorkflowStatistics(),
          getRecentActivity(8),
        ]);

        setData({
          summary,
          taskStatistics,
          workflows,
          recentActivity,
        });
      } catch (err) {
        console.error(
          "Unable to load dashboard:",
          err,
        );

        setError(
          "Unable to load dashboard data.",
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const activeWorkflows =
    useMemo(() => {
      if (!data) {
        return [];
      }

      return data.workflows.filter(
        (workflow) =>
          workflow.status ===
          "ACTIVE",
      );
    }, [data]);

  if (loading) {
    return (
      <>
        <Header
          title="Dashboard"
          subtitle="Overview of workflows, tasks and approvals"
        />

        <div className="space-y-6 p-4 md:p-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map(
              (item) => (
                <div
                  key={item}
                  className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-white"
                />
              ),
            )}
          </div>

          <div className="grid gap-5 xl:grid-cols-3">
            <div className="h-80 animate-pulse rounded-2xl border border-slate-200 bg-white xl:col-span-2" />

            <div className="h-80 animate-pulse rounded-2xl border border-slate-200 bg-white" />
          </div>

          <div className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-white" />
        </div>
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <Header
          title="Dashboard"
          subtitle="Overview of workflows, tasks and approvals"
        />

        <div className="flex min-h-[65vh] items-center justify-center p-6">
          <div className="max-w-md rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm">
            <AlertTriangle
              size={34}
              className="mx-auto text-red-500"
            />

            <h2 className="mt-4 text-lg font-semibold text-slate-800">
              Dashboard unavailable
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                void loadDashboard()
              }
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <RefreshCw size={16} />
              Try again
            </button>
          </div>
        </div>
      </>
    );
  }

  const statCards = [
    {
      label: "Total Workflows",
      value:
        data.summary.workflows.total,
      icon: Workflow,
      detail: `${data.summary.workflows.active} active`,
    },
    {
      label: "Active Tasks",
      value:
        data.summary.tasks.in_progress,
      icon: ListTodo,
      detail: `${data.summary.tasks.total} total`,
    },
    {
      label: "Pending Approvals",
      value:
        data.summary.approvals.pending,
      icon: Clock3,
      detail: `${data.summary.approvals.approved} approved`,
    },
    {
      label: "Overdue Tasks",
      value:
        data.summary.tasks.overdue,
      icon: AlertTriangle,
      detail: `${data.summary.tasks.due_soon} due soon`,
    },
  ];

  const maxTaskCount = Math.max(
    1,
    ...data.taskStatistics.by_status.map(
      (item) => item.count,
    ),
  );

  return (
    <>
      <Header
        title="Dashboard"
        subtitle="Overview of workflows, tasks and approvals"
      />

      <div className="space-y-6 p-4 md:p-6">
        {/* Summary cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => {
            const Icon = card.icon;

            return (
              <section
                key={card.label}
                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      {card.label}
                    </p>

                    <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                      {card.value}
                    </p>

                    <p className="mt-2 text-xs text-slate-400">
                      {card.detail}
                    </p>
                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <Icon size={20} />
                  </div>
                </div>
              </section>
            );
          })}
        </div>

        {/* Main dashboard row */}
        <div className="grid gap-5 xl:grid-cols-3">
          {/* Active workflows */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800">
                  Active Workflows
                </h3>

                <p className="mt-1 text-xs text-slate-400">
                  Current workflow progress
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/workflows",
                  )
                }
                className="text-sm font-medium text-blue-600 transition hover:text-blue-700"
              >
                View all
              </button>
            </div>

            {activeWorkflows.length ===
            0 ? (
              <div className="flex min-h-56 items-center justify-center">
                <div className="text-center">
                  <Workflow
                    size={32}
                    className="mx-auto text-slate-300"
                  />

                  <p className="mt-3 text-sm font-medium text-slate-600">
                    No active workflows
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Active workflows will
                    appear here.
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-6 space-y-5">
                {activeWorkflows
                  .slice(0, 5)
                  .map(
                    (workflow) => (
                      <button
                        key={
                          workflow.id
                        }
                        type="button"
                        onClick={() =>
                          navigate(
                            "/workflows",
                          )
                        }
                        className="block w-full rounded-xl border border-slate-100 p-4 text-left transition hover:bg-slate-50"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-800">
                              {
                                workflow.name
                              }
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              {
                                workflow.completed_tasks
                              }{" "}
                              of{" "}
                              {
                                workflow.total_tasks
                              }{" "}
                              tasks completed
                            </p>
                          </div>

                          <span className="text-sm font-semibold text-slate-700">
                            {
                              workflow.progress_percentage
                            }
                            %
                          </span>
                        </div>

                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-blue-600 transition-all"
                            style={{
                              width: `${Math.min(
                                100,
                                Math.max(
                                  0,
                                  workflow.progress_percentage,
                                ),
                              )}%`,
                            }}
                          />
                        </div>
                      </button>
                    ),
                  )}
              </div>
            )}
          </section>

          {/* Task statistics */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <h3 className="font-bold text-slate-800">
                Task Status
              </h3>

              <p className="mt-1 text-xs text-slate-400">
                Distribution by current
                status
              </p>
            </div>

            {data.taskStatistics
              .by_status.length ===
            0 ? (
              <div className="flex min-h-56 items-center justify-center">
                <div className="text-center">
                  <ListTodo
                    size={30}
                    className="mx-auto text-slate-300"
                  />

                  <p className="mt-3 text-sm text-slate-500">
                    No task data yet.
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {data.taskStatistics.by_status.map(
                  (item) => {
                    const percentage =
                      (item.count /
                        maxTaskCount) *
                      100;

                    return (
                      <div
                        key={
                          item.status
                        }
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-600">
                            {formatLabel(
                              item.status,
                            )}
                          </span>

                          <span className="text-sm font-semibold text-slate-800">
                            {
                              item.count
                            }
                          </span>
                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-blue-500"
                            style={{
                              width: `${percentage}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            )}
          </section>
        </div>

        {/* Bottom row */}
        <div className="grid gap-5 xl:grid-cols-3">
          {/* Recent activity */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
            <div>
              <h3 className="font-bold text-slate-800">
                Recent Activity
              </h3>

              <p className="mt-1 text-xs text-slate-400">
                Latest recorded system
                activity
              </p>
            </div>

            {data.recentActivity.length ===
            0 ? (
              <div className="flex min-h-44 items-center justify-center">
                <p className="text-sm text-slate-400">
                  No recent activity.
                </p>
              </div>
            ) : (
              <div className="mt-5 divide-y divide-slate-100">
                {data.recentActivity.map(
                  (activity) => (
                    <div
                      key={
                        activity.id
                      }
                      className="flex gap-3 py-4 first:pt-0"
                    >
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                        <CheckCircle2
                          size={17}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-700">
                          {
                            activity.description
                          }
                        </p>

                        <div className="mt-1 flex flex-wrap gap-x-2 text-xs text-slate-400">
                          {activity.actor && (
                            <span>
                              {
                                activity.actor
                              }
                            </span>
                          )}

                          <span>
                            {formatDate(
                              activity.created_at,
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}
          </section>

          {/* Pending approvals */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex h-full flex-col">
              <div>
                <h3 className="font-bold text-slate-800">
                  Pending Approvals
                </h3>

                <p className="mt-1 text-xs text-slate-400">
                  Approval requests
                  awaiting action
                </p>
              </div>

              <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                  <Clock3
                    size={24}
                  />
                </div>

                <p className="mt-4 text-4xl font-bold text-slate-900">
                  {
                    data.summary
                      .approvals
                      .pending
                  }
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Pending approvals
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/approvals",
                  )
                }
                className="w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Open Approvals
              </button>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}