import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  ListTodo,
  RefreshCw,
  UserRound,
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
   type TaskStatus,
  type WorkflowTask,
} from "../api/workflow-details.api";

import { useAuth } from "../context/AuthContext";

type ColumnDefinition = {
  key: TaskStatus;
  label: string;
};

const columns: ColumnDefinition[] = [
  {
    key: "TODO",
    label: "To Do",
  },
  {
    key: "IN_PROGRESS",
    label: "In Progress",
  },
  {
    key: "PENDING_APPROVAL",
    label: "Pending Approval",
  },
  {
    key: "COMPLETED",
    label: "Completed",
  },
];

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) =>
      char.toUpperCase(),
    );
}

function priorityClasses(
  priority: WorkflowTask["priority"],
) {
  switch (priority) {
    case "URGENT":
      return "border-red-100 bg-red-50 text-red-700";

    case "HIGH":
      return "border-orange-100 bg-orange-50 text-orange-700";

    case "MEDIUM":
      return "border-amber-100 bg-amber-50 text-amber-700";

    default:
      return "border-slate-200 bg-slate-100 text-slate-600";
  }
}

export default function TasksPage() {
  const navigate = useNavigate();

  const { user } = useAuth();

  const [
    tasks,
    setTasks,
  ] = useState<WorkflowTask[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const loadTasks =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        /*
         * The backend already scopes GET /tasks/
         * by the current user's role.
         *
         * We pass an empty workflow id here only because
         * getWorkflowTasks currently filters by workflow.
         * So instead, fetch directly below.
         */

        const response =
          await fetch(
            `${import.meta.env.VITE_API_BASE_URL}/tasks/`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem(
                  "access_token",
                )}`,
              },
            },
          );

        if (!response.ok) {
          throw new Error(
            "Unable to load tasks.",
          );
        }

        const payload =
          await response.json();

        const result: WorkflowTask[] =
          Array.isArray(payload)
            ? payload
            : payload.results ?? [];

        const userTasks =
          user?.id
            ? result.filter(
                (task) =>
                  task.assigned_to ===
                  user.id,
              )
            : result;

        setTasks(userTasks);
      } catch (err) {
        console.error(
          "Unable to load tasks:",
          err,
        );

        setError(
          "Unable to load your tasks.",
        );
      } finally {
        setLoading(false);
      }
    }, [user?.id]);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  const groupedTasks =
    useMemo(() => {
      const grouped: Record<
        TaskStatus,
        WorkflowTask[]
      > = {
        TODO: [],
        IN_PROGRESS: [],
        PENDING_APPROVAL: [],
        COMPLETED: [],
        CANCELLED: [],
      };

      for (const task of tasks) {
        grouped[
          task.status
        ].push(task);
      }

      return grouped;
    }, [tasks]);

  return (
    <>
      <Header
        title="My Tasks"
        subtitle="Tasks assigned to you"
      />

      <div className="space-y-5 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">
              {tasks.length}{" "}
              {tasks.length === 1
                ? "task"
                : "tasks"}{" "}
              assigned to you
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              void loadTasks()
            }
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <RefreshCw size={15} />

            Refresh
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <div className="grid min-w-[1050px] grid-cols-4 gap-4">
            {columns.map(
              (column) => {
                const columnTasks =
                  groupedTasks[
                    column.key
                  ];

                return (
                  <section
                    key={
                      column.key
                    }
                    className="min-h-[560px] rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {column.key ===
                        "TODO" ? (
                          <ListTodo
                            size={16}
                            className="text-slate-500"
                          />
                        ) : column.key ===
                          "IN_PROGRESS" ? (
                          <Clock3
                            size={16}
                            className="text-blue-500"
                          />
                        ) : column.key ===
                          "PENDING_APPROVAL" ? (
                          <UserRound
                            size={16}
                            className="text-amber-500"
                          />
                        ) : (
                          <CheckCircle2
                            size={16}
                            className="text-emerald-500"
                          />
                        )}

                        <h3 className="font-bold text-slate-700">
                          {
                            column.label
                          }
                        </h3>
                      </div>

                      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-500 shadow-sm">
                        {
                          columnTasks.length
                        }
                      </span>
                    </div>

                    {loading ? (
                      <div className="space-y-3">
                        {[1, 2].map(
                          (
                            item,
                          ) => (
                            <div
                              key={
                                item
                              }
                              className="h-32 animate-pulse rounded-xl bg-white"
                            />
                          ),
                        )}
                      </div>
                    ) : columnTasks.length ===
                      0 ? (
                      <div className="flex min-h-40 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white/50">
                        <p className="text-xs text-slate-400">
                          No tasks to display
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {columnTasks.map(
                          (
                            task,
                          ) => (
                            <button
                              key={
                                task.id
                              }
                              type="button"
                              onClick={() =>
                                navigate(
                                  `/tasks/${task.id}`,
                                )
                              }
                              className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-bold text-slate-800">
                                    {
                                      task.title
                                    }
                                  </p>

                                  {task.description && (
                                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">
                                      {
                                        task.description
                                      }
                                    </p>
                                  )}
                                </div>

                                <span
                                  className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-semibold ${priorityClasses(
                                    task.priority,
                                  )}`}
                                >
                                  {formatLabel(
                                    task.priority,
                                  )}
                                </span>
                              </div>

                              <div className="mt-4 space-y-2 text-xs text-slate-400">
                                {task.due_date && (
                                  <div className="flex items-center gap-2">
                                    <CalendarDays
                                      size={
                                        13
                                      }
                                    />

                                    <span>
                                      {new Date(
                                        `${task.due_date}T00:00:00`,
                                      ).toLocaleDateString()}
                                    </span>
                                  </div>
                                )}

                                {task.assigned_to_name && (
                                  <div className="flex items-center gap-2">
                                    <UserRound
                                      size={
                                        13
                                      }
                                    />

                                    <span className="truncate">
                                      {
                                        task.assigned_to_name
                                      }
                                    </span>
                                  </div>
                                )}
                              </div>
                            </button>
                          ),
                        )}
                      </div>
                    )}
                  </section>
                );
              },
            )}
          </div>
        </div>
      </div>
    </>
  );
}