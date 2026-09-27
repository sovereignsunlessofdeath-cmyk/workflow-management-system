import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Layers3,
  ListTodo,
  Plus,
  Trash2,
  Workflow as WorkflowIcon,
  X,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import Header from "../components/layout/Header";

import {
  createWorkflowStage,
  createWorkflowTask,
  deleteWorkflowStage,
  getTaskDependencies,
  getWorkflowDetail,
  getWorkflowStages,
  getWorkflowTasks,
  type TaskDependency,
  type WorkflowStage,
  type WorkflowTask,
} from "../api/workflow-details.api";

import type {
  WorkflowItem,
} from "../api/workflows.api";

import {
  getAssignableUsers,
  type UserItem,
} from "../api/users.api";

type DetailData = {
  workflow: WorkflowItem;
  stages: WorkflowStage[];
  tasks: WorkflowTask[];
  dependencies: TaskDependency[];
};

type TaskPriority =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "URGENT";

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) =>
      char.toUpperCase(),
    );
}

export default function WorkflowDetailPage() {
  const { workflowId } =
    useParams();

  const navigate =
    useNavigate();

  const [data, setData] =
    useState<DetailData | null>(
      null,
    );

  const [loading, setLoading] =
    useState(true);

  const [pageError, setPageError] =
    useState("");

  const [actionError, setActionError] =
    useState("");

  // =========================
  // STAGE STATE
  // =========================

  const [
    stageModalOpen,
    setStageModalOpen,
  ] = useState(false);

  const [
    stageName,
    setStageName,
  ] = useState("");

  const [
    stageDescription,
    setStageDescription,
  ] = useState("");

  const [
    stageOrder,
    setStageOrder,
  ] = useState("");

  const [
    submittingStage,
    setSubmittingStage,
  ] = useState(false);

  // =========================
  // TASK STATE
  // =========================

  const [
    taskModalOpen,
    setTaskModalOpen,
  ] = useState(false);

  const [
    assignableUsers,
    setAssignableUsers,
  ] = useState<UserItem[]>([]);

  const [
    loadingUsers,
    setLoadingUsers,
  ] = useState(false);

  const [
    taskTitle,
    setTaskTitle,
  ] = useState("");

  const [
    taskDescription,
    setTaskDescription,
  ] = useState("");

  const [
    taskStage,
    setTaskStage,
  ] = useState("");

  const [
    taskAssignee,
    setTaskAssignee,
  ] = useState("");

  const [
    taskPriority,
    setTaskPriority,
  ] =
    useState<TaskPriority>(
      "MEDIUM",
    );

  const [
    taskDueDate,
    setTaskDueDate,
  ] = useState("");

  const [
    submittingTask,
    setSubmittingTask,
  ] = useState(false);

  // =========================
  // LOAD WORKFLOW
  // =========================

  const loadData =
    useCallback(async () => {
      if (!workflowId) {
        return;
      }

      try {
        setLoading(true);
        setPageError("");

        const [
          workflow,
          stages,
          tasks,
          dependencies,
        ] = await Promise.all([
          getWorkflowDetail(
            workflowId,
          ),
          getWorkflowStages(
            workflowId,
          ),
          getWorkflowTasks(
            workflowId,
          ),
          getTaskDependencies(),
        ]);

        setData({
          workflow,
          stages,
          tasks,
          dependencies,
        });
      } catch (err) {
        console.error(
          "Unable to load workflow:",
          err,
        );

        setPageError(
          "Unable to load workflow details.",
        );
      } finally {
        setLoading(false);
      }
    }, [workflowId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // =========================
  // CALCULATED VALUES
  // =========================

  const completedTasks =
    useMemo(() => {
      if (!data) {
        return 0;
      }

      return data.tasks.filter(
        (task) =>
          task.status ===
          "COMPLETED",
      ).length;
    }, [data]);

  const progress =
    useMemo(() => {
      if (
        !data ||
        data.tasks.length === 0
      ) {
        return 0;
      }

      return Math.round(
        (completedTasks /
          data.tasks.length) *
          100,
      );
    }, [
      data,
      completedTasks,
    ]);

  const workflowDependencies =
    useMemo(() => {
      if (!data) {
        return [];
      }

      return data.dependencies.filter(
        (dependency) =>
          data.tasks.some(
            (task) =>
              task.id ===
              dependency.task,
          ),
      );
    }, [data]);

  // =========================
  // STAGE ACTIONS
  // =========================

  async function handleCreateStage(
    event: React.FormEvent,
  ) {
    event.preventDefault();

    if (!workflowId) {
      return;
    }

    try {
      setSubmittingStage(true);
      setActionError("");

      const stage =
        await createWorkflowStage({
          workflow: workflowId,
          name: stageName.trim(),
          description:
            stageDescription.trim(),
          order: Number(stageOrder),
        });

      setData((current) =>
        current
          ? {
              ...current,
              stages: [
                ...current.stages,
                stage,
              ].sort(
                (a, b) =>
                  a.order -
                  b.order,
              ),
            }
          : current,
      );

      setStageName("");
      setStageDescription("");
      setStageOrder("");
      setStageModalOpen(false);
    } catch (err: any) {
      console.error(
        "Unable to create stage:",
        err,
      );

      setActionError(
        err?.response?.data
          ?.order?.[0] ??
          err?.response?.data
            ?.non_field_errors?.[0] ??
          err?.response?.data
            ?.detail ??
          "Unable to create stage.",
      );
    } finally {
      setSubmittingStage(false);
    }
  }

  async function handleDeleteStage(
    stageId: string,
  ) {
    const confirmed =
      window.confirm(
        "Delete this stage?",
      );

    if (!confirmed) {
      return;
    }

    try {
      setActionError("");

      await deleteWorkflowStage(
        stageId,
      );

      setData((current) =>
        current
          ? {
              ...current,
              stages:
                current.stages.filter(
                  (stage) =>
                    stage.id !==
                    stageId,
                ),
            }
          : current,
      );
    } catch (err) {
      console.error(
        "Unable to delete stage:",
        err,
      );

      setActionError(
        "Unable to delete stage.",
      );
    }
  }

  // =========================
  // TASK ACTIONS
  // =========================

  function resetTaskForm() {
    setTaskTitle("");
    setTaskDescription("");
    setTaskStage("");
    setTaskAssignee("");
    setTaskPriority("MEDIUM");
    setTaskDueDate("");
  }

  async function openTaskModal() {
    try {
      setActionError("");
      setLoadingUsers(true);

      const users =
        await getAssignableUsers();

      setAssignableUsers(users);

      resetTaskForm();

      setTaskModalOpen(true);
    } catch (err) {
      console.error(
        "Unable to load assignable users:",
        err,
      );

      setActionError(
        "Unable to load assignable users.",
      );
    } finally {
      setLoadingUsers(false);
    }
  }

  function closeTaskModal() {
    if (submittingTask) {
      return;
    }

    setTaskModalOpen(false);
    resetTaskForm();
  }

  async function handleCreateTask(
    event: React.FormEvent,
  ) {
    event.preventDefault();

    if (!workflowId) {
      return;
    }

    try {
      setSubmittingTask(true);
      setActionError("");

      const task =
        await createWorkflowTask({
          workflow: workflowId,
          stage:
            taskStage || null,
          title:
            taskTitle.trim(),
          description:
            taskDescription.trim(),
          assigned_to:
            taskAssignee || null,
          priority:
            taskPriority,
          due_date:
            taskDueDate || null,
        });

      setData((current) => {
        if (!current) {
          return current;
        }

        const updatedStages =
          current.stages.map(
            (stage) => {
              if (
                task.stage &&
                stage.id ===
                  task.stage
              ) {
                return {
                  ...stage,
                  task_count:
                    stage.task_count +
                    1,
                };
              }

              return stage;
            },
          );

        return {
          ...current,
          stages: updatedStages,
          tasks: [
            ...current.tasks,
            task,
          ],
        };
      });

      resetTaskForm();
      setTaskModalOpen(false);
    } catch (err: any) {
      console.error(
        "Unable to create task:",
        err,
      );

      setActionError(
        err?.response?.data
          ?.detail ??
          err?.response?.data
            ?.title?.[0] ??
          err?.response?.data
            ?.stage?.[0] ??
          err?.response?.data
            ?.assigned_to?.[0] ??
          err?.response?.data
            ?.due_date?.[0] ??
          err?.response?.data
            ?.non_field_errors?.[0] ??
          "Unable to create task.",
      );
    } finally {
      setSubmittingTask(false);
    }
  }

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <>
        <Header
          title="Workflow"
          subtitle="Loading workflow details"
        />

        <div className="space-y-5 p-6">
          <div className="h-44 animate-pulse rounded-2xl bg-white" />
          <div className="h-72 animate-pulse rounded-2xl bg-white" />
        </div>
      </>
    );
  }

  // =========================
  // PAGE ERROR
  // =========================

  if (
    pageError ||
    !data
  ) {
    return (
      <>
        <Header
          title="Workflow"
          subtitle="Workflow details"
        />

        <div className="p-6">
          <div className="rounded-2xl border border-red-100 bg-white p-8 text-center">
            <p className="text-red-600">
              {pageError ||
                "Workflow not found."}
            </p>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/workflows",
                )
              }
              className="mt-4 text-sm font-medium text-blue-600"
            >
              Back to workflows
            </button>
          </div>
        </div>
      </>
    );
  }

  const {
    workflow,
    stages,
    tasks,
  } = data;

  return (
    <>
      <Header
        title={workflow.name}
        subtitle="Workflow details and execution"
      />

      <div className="space-y-6 p-4 md:p-6">
        {/* BACK */}

        <button
          type="button"
          onClick={() =>
            navigate(
              "/workflows",
            )
          }
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-700"
        >
          <ArrowLeft size={16} />

          Back to workflows
        </button>

        {/* ACTION ERROR */}

        {actionError && (
          <div className="flex items-center justify-between rounded-xl border border-red-100 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-700">
              {actionError}
            </p>

            <button
              type="button"
              onClick={() =>
                setActionError("")
              }
              className="text-red-400 transition hover:text-red-600"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* WORKFLOW OVERVIEW */}

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <WorkflowIcon
                  size={24}
                  className="text-blue-600"
                />

                <h2 className="text-2xl font-bold text-slate-800">
                  {workflow.name}
                </h2>
              </div>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                {workflow.description ||
                  "No description provided."}
              </p>
            </div>

            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
              {formatLabel(
                workflow.status,
              )}
            </span>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-400">
                Total Tasks
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-800">
                {tasks.length}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-400">
                Completed
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-800">
                {completedTasks}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-400">
                Start Date
              </p>

              <p className="mt-2 text-sm font-semibold text-slate-700">
                {workflow.start_date ??
                  "—"}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-400">
                End Date
              </p>

              <p className="mt-2 text-sm font-semibold text-slate-700">
                {workflow.end_date ??
                  "—"}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-600">
                Progress
              </span>

              <span className="font-semibold text-slate-800">
                {progress}%
              </span>
            </div>

            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-blue-600 transition-all duration-300"
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>
          </div>
        </section>

        {/* STAGES + SUMMARY */}

        <div className="grid gap-5 xl:grid-cols-3">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800">
                  Workflow Stages
                </h3>

                <p className="mt-1 text-xs text-slate-400">
                  Ordered execution
                  stages
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setStageModalOpen(
                    true,
                  )
                }
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                <Plus size={16} />

                Add Stage
              </button>
            </div>

            {stages.length ===
            0 ? (
              <div className="flex min-h-48 items-center justify-center text-center">
                <div>
                  <Layers3
                    size={32}
                    className="mx-auto text-slate-300"
                  />

                  <p className="mt-3 text-sm text-slate-500">
                    No stages yet.
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {stages.map(
                  (stage) => (
                    <div
                      key={stage.id}
                      className="flex items-center justify-between rounded-xl border border-slate-100 p-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-600">
                          {
                            stage.order
                          }
                        </div>

                        <div>
                          <p className="font-semibold text-slate-800">
                            {
                              stage.name
                            }
                          </p>

                          {stage.description && (
                            <p className="mt-1 text-xs text-slate-500">
                              {
                                stage.description
                              }
                            </p>
                          )}

                          <p className="mt-1 text-xs text-slate-400">
                            {
                              stage.task_count
                            }{" "}
                            {stage.task_count ===
                            1
                              ? "task"
                              : "tasks"}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          void handleDeleteStage(
                            stage.id,
                          )
                        }
                        className="rounded-lg p-2 text-red-500 transition hover:bg-red-50"
                        title="Delete stage"
                      >
                        <Trash2
                          size={16}
                        />
                      </button>
                    </div>
                  ),
                )}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="font-bold text-slate-800">
              Summary
            </h3>

            <div className="mt-5 space-y-5">
              <div className="flex items-center gap-3">
                <ListTodo
                  size={18}
                  className="text-blue-500"
                />

                <div>
                  <p className="text-xs text-slate-400">
                    Tasks
                  </p>

                  <p className="font-semibold text-slate-700">
                    {tasks.length}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <CheckCircle2
                  size={18}
                  className="text-emerald-500"
                />

                <div>
                  <p className="text-xs text-slate-400">
                    Completed
                  </p>

                  <p className="font-semibold text-slate-700">
                    {
                      completedTasks
                    }
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock3
                  size={18}
                  className="text-amber-500"
                />

                <div>
                  <p className="text-xs text-slate-400">
                    Dependencies
                  </p>

                  <p className="font-semibold text-slate-700">
                    {
                      workflowDependencies.length
                    }
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Layers3
                  size={18}
                  className="text-violet-500"
                />

                <div>
                  <p className="text-xs text-slate-400">
                    Stages
                  </p>

                  <p className="font-semibold text-slate-700">
                    {stages.length}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* TASKS */}

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-bold text-slate-800">
                Tasks
              </h3>

              <p className="mt-1 text-xs text-slate-400">
                Tasks belonging to this
                workflow
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                void openTaskModal()
              }
              disabled={loadingUsers}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus size={16} />

              {loadingUsers
                ? "Loading..."
                : "Create Task"}
            </button>
          </div>

          {tasks.length === 0 ? (
            <div className="flex min-h-48 items-center justify-center text-center">
              <div>
                <ListTodo
                  size={34}
                  className="mx-auto text-slate-300"
                />

                <p className="mt-3 text-sm font-medium text-slate-500">
                  No tasks in this
                  workflow yet.
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Create the first task
                  to begin execution.
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {tasks.map(
                (task) => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() =>
                      navigate(
                        `/tasks/${task.id}`,
                      )
                    }
                    className="rounded-xl border border-slate-100 p-4 text-left transition hover:border-slate-200 hover:bg-slate-50"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-800">
                          {
                            task.title
                          }
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {formatLabel(
                            task.status,
                          )}
                        </p>
                      </div>

                      <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                        {formatLabel(
                          task.priority,
                        )}
                      </span>
                    </div>

                    {task.description && (
                      <p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-500">
                        {
                          task.description
                        }
                      </p>
                    )}

                    <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-400">
                      {task.assigned_to_name && (
                        <span>
                          Assigned to{" "}
                          {
                            task.assigned_to_name
                          }
                        </span>
                      )}

                      {task.due_date && (
                        <span className="flex items-center gap-1.5">
                          <CalendarDays
                            size={13}
                          />

                          {new Date(
                            task.due_date,
                          ).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </button>
                ),
              )}
            </div>
          )}
        </section>
      </div>

      {/* ========================= */}
      {/* ADD STAGE MODAL */}
      {/* ========================= */}

      {stageModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="font-bold text-slate-800">
                  Add Workflow Stage
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  Add an ordered stage
                  to this workflow.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setStageModalOpen(
                    false,
                  )
                }
                disabled={
                  submittingStage
                }
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={
                handleCreateStage
              }
              className="space-y-4 p-5"
            >
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Stage name
                </label>

                <input
                  value={stageName}
                  onChange={(event) =>
                    setStageName(
                      event.target
                        .value,
                    )
                  }
                  required
                  placeholder="e.g. Review"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Description
                </label>

                <textarea
                  value={
                    stageDescription
                  }
                  onChange={(event) =>
                    setStageDescription(
                      event.target
                        .value,
                    )
                  }
                  placeholder="Optional stage description"
                  rows={3}
                  className="mt-2 w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Order
                </label>

                <input
                  type="number"
                  min="1"
                  value={stageOrder}
                  onChange={(event) =>
                    setStageOrder(
                      event.target
                        .value,
                    )
                  }
                  required
                  placeholder="1"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400"
                />
              </div>

              <button
                type="submit"
                disabled={
                  submittingStage
                }
                className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submittingStage
                  ? "Creating..."
                  : "Create Stage"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================= */}
      {/* CREATE TASK MODAL */}
      {/* ========================= */}

      {taskModalOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  Create Task
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Add a task to{" "}
                  {workflow.name}.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeTaskModal
                }
                disabled={
                  submittingTask
                }
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={
                handleCreateTask
              }
              className="space-y-5 p-6"
            >
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Task title
                </label>

                <input
                  value={taskTitle}
                  onChange={(event) =>
                    setTaskTitle(
                      event.target
                        .value,
                    )
                  }
                  required
                  placeholder="Enter task title"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Description
                </label>

                <textarea
                  value={
                    taskDescription
                  }
                  onChange={(event) =>
                    setTaskDescription(
                      event.target
                        .value,
                    )
                  }
                  rows={4}
                  placeholder="Describe the task"
                  className="mt-2 w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Stage
                  </label>

                  <select
                    value={
                      taskStage
                    }
                    onChange={(
                      event,
                    ) =>
                      setTaskStage(
                        event.target
                          .value,
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400"
                  >
                    <option value="">
                      No stage
                    </option>

                    {stages.map(
                      (stage) => (
                        <option
                          key={
                            stage.id
                          }
                          value={
                            stage.id
                          }
                        >
                          {
                            stage.order
                          }
                          .{" "}
                          {
                            stage.name
                          }
                        </option>
                      ),
                    )}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Assignee
                  </label>

                  <select
                    value={
                      taskAssignee
                    }
                    onChange={(
                      event,
                    ) =>
                      setTaskAssignee(
                        event.target
                          .value,
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400"
                  >
                    <option value="">
                      Unassigned
                    </option>

                    {assignableUsers.map(
                      (user) => (
                        <option
                          key={
                            user.id
                          }
                          value={
                            user.id
                          }
                        >
                          {user.full_name ||
                            user.email}
                        </option>
                      ),
                    )}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Priority
                  </label>

                  <select
                    value={
                      taskPriority
                    }
                    onChange={(
                      event,
                    ) =>
                      setTaskPriority(
                        event.target
                          .value as TaskPriority,
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400"
                  >
                    <option value="LOW">
                      Low
                    </option>

                    <option value="MEDIUM">
                      Medium
                    </option>

                    <option value="HIGH">
                      High
                    </option>

                    <option value="URGENT">
                      Urgent
                    </option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Due date
                  </label>

                <input
  type="date"
  value={taskDueDate}
  onChange={(event) =>
    setTaskDueDate(
      event.target.value,
    )
  }
  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400"
/>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={
                    closeTaskModal
                  }
                  disabled={
                    submittingTask
                  }
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    submittingTask ||
                    !taskTitle.trim()
                  }
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submittingTask
                    ? "Creating..."
                    : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}