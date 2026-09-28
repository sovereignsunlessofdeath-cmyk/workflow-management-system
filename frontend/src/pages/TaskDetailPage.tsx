import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock3,
  GitBranch,
  LockKeyhole,
  Plus,
  RotateCcw,
  ShieldCheck,
  Trash2,
  UserRound,
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

import { useAuth } from "../context/AuthContext";

import {
  createApproval,
  createTaskDependency,
  deleteTaskDependency,
  getApprovals,
  getTask,
  getTaskDependencies,
  getWorkflowDetail,
  getWorkflowStages,
  getWorkflowTasks,
  permanentlyDeleteTask,
  reopenTask,
  updateTask,
  type ApprovalItem,
  type TaskDependency,
  type TaskStatus,
  type WorkflowStage,
  type WorkflowTask,
} from "../api/workflow-details.api";

import {
  getAssignableUsers,
  type UserItem,
} from "../api/users.api";

import type {
  WorkflowItem,
} from "../api/workflows.api";

type TaskPageData = {
  task: WorkflowTask;
  workflow: WorkflowItem;
  stages: WorkflowStage[];
  workflowTasks: WorkflowTask[];
  dependencies: TaskDependency[];
  approvals: ApprovalItem[];
};

function formatLabel(
  value: string,
) {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase(),
    );
}

function statusClasses(
  status: TaskStatus,
) {
  switch (status) {
    case "COMPLETED":
      return (
        "border-emerald-100 " +
        "bg-emerald-50 " +
        "text-emerald-700"
      );

    case "IN_PROGRESS":
      return (
        "border-blue-100 " +
        "bg-blue-50 " +
        "text-blue-700"
      );

    case "PENDING_APPROVAL":
      return (
        "border-amber-100 " +
        "bg-amber-50 " +
        "text-amber-700"
      );

    case "CANCELLED":
      return (
        "border-red-100 " +
        "bg-red-50 " +
        "text-red-700"
      );

    default:
      return (
        "border-slate-200 " +
        "bg-slate-100 " +
        "text-slate-600"
      );
  }
}

function priorityClasses(
  priority:
    WorkflowTask["priority"],
) {
  switch (priority) {
    case "URGENT":
      return (
        "border-red-100 " +
        "bg-red-50 " +
        "text-red-700"
      );

    case "HIGH":
      return (
        "border-orange-100 " +
        "bg-orange-50 " +
        "text-orange-700"
      );

    case "MEDIUM":
      return (
        "border-amber-100 " +
        "bg-amber-50 " +
        "text-amber-700"
      );

    default:
      return (
        "border-slate-200 " +
        "bg-slate-100 " +
        "text-slate-600"
      );
  }
}

function getErrorMessage(
  error: any,
  fallback: string,
) {
  const response =
    error?.response?.data;

  if (
    typeof response?.detail ===
    "string"
  ) {
    return response.detail;
  }

  if (
    Array.isArray(
      response?.status,
    )
  ) {
    return response.status[0];
  }

  if (
    Array.isArray(
      response?.reason,
    )
  ) {
    return response.reason[0];
  }

  if (
    Array.isArray(
      response?.task,
    )
  ) {
    return response.task[0];
  }

  if (
    Array.isArray(
      response?.approver,
    )
  ) {
    return response.approver[0];
  }

  if (
    Array.isArray(
      response?.non_field_errors,
    )
  ) {
    return (
      response
        .non_field_errors[0]
    );
  }

  return fallback;
}

export default function TaskDetailPage() {
  const { taskId } =
    useParams();

  const navigate =
    useNavigate();

  const { user } =
    useAuth();

  const isAdministrator =
    user?.role ===
    "ADMINISTRATOR";

  const [
    data,
    setData,
  ] =
    useState<
      TaskPageData | null
    >(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    pageError,
    setPageError,
  ] = useState("");

  const [
    actionError,
    setActionError,
  ] = useState("");

  const [
    updatingStatus,
    setUpdatingStatus,
  ] = useState(false);

  // ================================
  // DEPENDENCIES
  // ================================

  const [
    dependencyModalOpen,
    setDependencyModalOpen,
  ] = useState(false);

  const [
    selectedDependencyTask,
    setSelectedDependencyTask,
  ] = useState("");

  const [
    submittingDependency,
    setSubmittingDependency,
  ] = useState(false);

  const [
    deletingDependencyId,
    setDeletingDependencyId,
  ] =
    useState<
      string | null
    >(null);

  // ================================
  // APPROVALS
  // ================================

  const [
    approvalModalOpen,
    setApprovalModalOpen,
  ] = useState(false);

  const [
    assignableUsers,
    setAssignableUsers,
  ] =
    useState<UserItem[]>([]);

  const [
    approverId,
    setApproverId,
  ] = useState("");

  const [
    approvalComment,
    setApprovalComment,
  ] = useState("");

  const [
    submittingApproval,
    setSubmittingApproval,
  ] = useState(false);

  // ================================
  // REOPEN
  // ================================

  const [
    reopenModalOpen,
    setReopenModalOpen,
  ] = useState(false);

  const [
    reopenReason,
    setReopenReason,
  ] = useState("");

  const [
    reopeningTask,
    setReopeningTask,
  ] = useState(false);

  // ================================
  // PERMANENT DELETE
  // ================================

  const [
    deletingTask,
    setDeletingTask,
  ] = useState(false);

  // ================================
  // LOAD DATA
  // ================================

  const loadData =
    useCallback(
      async () => {
        if (!taskId) {
          return;
        }

        try {
          setLoading(true);
          setPageError("");

          const task =
            await getTask(
              taskId,
            );

          const [
            workflow,
            stages,
            workflowTasks,
            dependencies,
            approvals,
          ] =
            await Promise.all([
              getWorkflowDetail(
                task.workflow,
              ),

              getWorkflowStages(
                task.workflow,
              ),

              getWorkflowTasks(
                task.workflow,
              ),

              getTaskDependencies(),

              getApprovals(),
            ]);

          setData({
            task,
            workflow,
            stages,
            workflowTasks,

            dependencies:
              dependencies.filter(
                (
                  dependency,
                ) =>
                  dependency.task ===
                  task.id,
              ),

            approvals:
              approvals.filter(
                (approval) =>
                  approval.task ===
                  task.id,
              ),
          });
        } catch (error) {
          console.error(
            "Unable to load task:",
            error,
          );

          setPageError(
            "Unable to load task details.",
          );
        } finally {
          setLoading(false);
        }
      },
      [taskId],
    );

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // ================================
  // COMPUTED VALUES
  // ================================

  const currentStage =
    useMemo(() => {
      if (
        !data ||
        !data.task.stage
      ) {
        return null;
      }

      return (
        data.stages.find(
          (stage) =>
            stage.id ===
            data.task.stage,
        ) ?? null
      );
    }, [data]);

  const dependencyTasks =
    useMemo(() => {
      if (!data) {
        return [];
      }

      return data.dependencies
        .map(
          (dependency) => {
            const task =
              data.workflowTasks.find(
                (item) =>
                  item.id ===
                  dependency.depends_on,
              );

            return {
              dependency,
              task,
            };
          },
        )
        .filter(
          (
            item,
          ): item is {
            dependency:
              TaskDependency;
            task:
              WorkflowTask;
          } =>
            Boolean(
              item.task,
            ),
        );
    }, [data]);

  const availableDependencyTasks =
    useMemo(() => {
      if (!data) {
        return [];
      }

      const
        currentDependencyIds =
          new Set(
            data.dependencies.map(
              (
                dependency,
              ) =>
                dependency
                  .depends_on,
            ),
          );

      return (
        data.workflowTasks.filter(
          (task) =>
            task.id !==
              data.task.id &&
            !currentDependencyIds.has(
              task.id,
            ),
        )
      );
    }, [data]);

  const pendingApproval =
    useMemo(() => {
      if (!data) {
        return null;
      }

      return (
        data.approvals.find(
          (approval) =>
            approval.status ===
            "PENDING",
        ) ?? null
      );
    }, [data]);

  // ================================
  // STATUS CHANGE
  // ================================

  async function handleStatusChange(
    status: TaskStatus,
  ) {
    if (
      !taskId ||
      !data ||
      status ===
        data.task.status
    ) {
      return;
    }

    try {
      setUpdatingStatus(true);
      setActionError("");

      const updated =
        await updateTask(
          taskId,
          {
            status,
          },
        );

      setData(
        (current) =>
          current
            ? {
                ...current,

                task:
                  updated,

                workflowTasks:
                  current
                    .workflowTasks
                    .map(
                      (
                        task,
                      ) =>
                        task.id ===
                        updated.id
                          ? updated
                          : task,
                    ),
              }
            : current,
      );
    } catch (
      error: any
    ) {
      console.error(
        "Unable to update task status:",
        error,
      );

      const detail =
        error?.response
          ?.data?.detail;

      const blocking =
        error?.response
          ?.data
          ?.blocking_tasks;

      if (
        Array.isArray(
          blocking,
        ) &&
        blocking.length > 0
      ) {
        setActionError(
          `${
            detail ??
            "Task cannot be completed."
          } Blocking tasks: ${blocking.join(
            ", ",
          )}`,
        );

        return;
      }

      setActionError(
        getErrorMessage(
          error,
          "Unable to update task status.",
        ),
      );
    } finally {
      setUpdatingStatus(
        false,
      );
    }
  }

  // ================================
  // REOPEN TASK
  // ================================

  function openReopenModal() {
    setActionError("");
    setReopenReason("");
    setReopenModalOpen(true);
  }

  function closeReopenModal() {
    if (reopeningTask) {
      return;
    }

    setReopenModalOpen(false);
    setReopenReason("");
  }

  async function handleReopenTask(
    event:
      React.FormEvent,
  ) {
    event.preventDefault();

    if (
      !taskId ||
      !reopenReason.trim()
    ) {
      return;
    }

    try {
      setReopeningTask(true);
      setActionError("");

      await reopenTask(
        taskId,
        reopenReason.trim(),
      );

      setReopenModalOpen(
        false,
      );

      setReopenReason("");

      await loadData();
    } catch (
      error: any
    ) {
      console.error(
        "Unable to reopen task:",
        error,
      );

      setActionError(
        getErrorMessage(
          error,
          "Unable to reopen task.",
        ),
      );
    } finally {
      setReopeningTask(
        false,
      );
    }
  }

  // ================================
  // PERMANENT DELETE
  // ================================

  async function
    handlePermanentDeleteTask() {
    if (
      !data ||
      !isAdministrator
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        `Permanently delete "${data.task.title}"?\n\nThis action cannot be undone.`,
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingTask(true);
      setActionError("");

      await permanentlyDeleteTask(
        data.task.id,
      );

      navigate(
        `/workflows/${data.workflow.id}`,
        {
          replace: true,
        },
      );
    } catch (
      error: any
    ) {
      console.error(
        "Unable to permanently delete task:",
        error,
      );

      setActionError(
        getErrorMessage(
          error,
          "Unable to permanently delete task.",
        ),
      );
    } finally {
      setDeletingTask(false);
    }
  }

  // ================================
  // DEPENDENCIES
  // ================================

  function openDependencyModal() {
    setActionError("");

    setSelectedDependencyTask(
      "",
    );

    setDependencyModalOpen(
      true,
    );
  }

  async function
    handleAddDependency(
      event:
        React.FormEvent,
    ) {
    event.preventDefault();

    if (
      !taskId ||
      !selectedDependencyTask
    ) {
      return;
    }

    try {
      setSubmittingDependency(
        true,
      );

      setActionError("");

      const dependency =
        await createTaskDependency(
          {
            task: taskId,

            depends_on:
              selectedDependencyTask,
          },
        );

      setData(
        (current) =>
          current
            ? {
                ...current,

                dependencies: [
                  ...current
                    .dependencies,

                  dependency,
                ],
              }
            : current,
      );

      setDependencyModalOpen(
        false,
      );

      setSelectedDependencyTask(
        "",
      );
    } catch (
      error: any
    ) {
      console.error(
        "Unable to create dependency:",
        error,
      );

      setActionError(
        getErrorMessage(
          error,
          "Unable to add dependency.",
        ),
      );
    } finally {
      setSubmittingDependency(
        false,
      );
    }
  }

  async function
    handleDeleteDependency(
      dependency:
        TaskDependency,
    ) {
    const confirmed =
      window.confirm(
        `Remove dependency "${dependency.depends_on_title}"?`,
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingDependencyId(
        dependency.id,
      );

      setActionError("");

      await deleteTaskDependency(
        dependency.id,
      );

      setData(
        (current) =>
          current
            ? {
                ...current,

                dependencies:
                  current
                    .dependencies
                    .filter(
                      (
                        item,
                      ) =>
                        item.id !==
                        dependency.id,
                    ),
              }
            : current,
      );
    } catch (
      error: any
    ) {
      console.error(
        "Unable to remove dependency:",
        error,
      );

      setActionError(
        getErrorMessage(
          error,
          "Unable to remove dependency.",
        ),
      );
    } finally {
      setDeletingDependencyId(
        null,
      );
    }
  }

  // ================================
  // APPROVALS
  // ================================

  async function
    openApprovalModal() {
    try {
      setActionError("");

      const users =
        await getAssignableUsers();

      setAssignableUsers(
        users.filter(
          (user) =>
            user.role ===
              "APPROVER" &&
            user.status ===
              "ACTIVE" &&
            user.is_active,
        ),
      );

      setApproverId("");
      setApprovalComment("");

      setApprovalModalOpen(
        true,
      );
    } catch (error) {
      console.error(
        "Unable to load approvers:",
        error,
      );

      setActionError(
        "Unable to load available approvers.",
      );
    }
  }

  async function
    handleRequestApproval(
      event:
        React.FormEvent,
    ) {
    event.preventDefault();

    if (
      !taskId ||
      !approverId
    ) {
      return;
    }

    try {
      setSubmittingApproval(
        true,
      );

      setActionError("");

      const approval =
        await createApproval({
          task: taskId,

          approver:
            approverId,

          comment:
            approvalComment.trim(),
        });

      setData(
        (current) =>
          current
            ? {
                ...current,

                approvals: [
                  approval,
                  ...current.approvals,
                ],

                task: {
                  ...current.task,

                  status:
                    "PENDING_APPROVAL",
                },
              }
            : current,
      );

      setApprovalModalOpen(
        false,
      );

      setApproverId("");
      setApprovalComment("");
    } catch (
      error: any
    ) {
      console.error(
        "Unable to request approval:",
        error,
      );

      setActionError(
        getErrorMessage(
          error,
          "Unable to request approval.",
        ),
      );
    } finally {
      setSubmittingApproval(
        false,
      );
    }
  }

  // ================================
  // LOADING
  // ================================

  if (loading) {
    return (
      <>
        <Header
          title="Task"
          subtitle="Loading task details"
        />

        <div className="space-y-5 p-6">
          <div className="h-40 animate-pulse rounded-2xl bg-white" />

          <div className="h-72 animate-pulse rounded-2xl bg-white" />
        </div>
      </>
    );
  }

  // ================================
  // PAGE ERROR
  // ================================

  if (
    pageError ||
    !data
  ) {
    return (
      <>
        <Header
          title="Task"
          subtitle="Task details"
        />

        <div className="p-6">
          <div className="rounded-2xl border border-red-100 bg-white p-8 text-center">
            <p className="text-sm text-red-600">
              {pageError ||
                "Task not found."}
            </p>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/tasks",
                )
              }
              className="mt-4 text-sm font-semibold text-blue-600"
            >
              Back to tasks
            </button>
          </div>
        </div>
      </>
    );
  }

  const {
    task,
    workflow,
    approvals,
  } = data;

  const taskIsCompleted =
    task.status ===
    "COMPLETED";

  return (
    <>
      <Header
        title={task.title}
        subtitle={`${workflow.name}${
          currentStage
            ? ` · ${currentStage.name}`
            : ""
        }`}
      />

      <div className="space-y-6 p-4 md:p-6">
        {/* BACK + ADMIN DELETE */}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() =>
              navigate(
                `/workflows/${workflow.id}`,
              )
            }
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-700"
          >
            <ArrowLeft
              size={16}
            />

            Back to workflow
          </button>

          {isAdministrator && (
            <button
              type="button"
              onClick={() =>
                void handlePermanentDeleteTask()
              }
              disabled={
                deletingTask
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2
                size={16}
              />

              {deletingTask
                ? "Deleting..."
                : "Delete Task Permanently"}
            </button>
          )}
        </div>

        {/* ERROR */}

        {actionError && (
          <div className="flex items-center justify-between gap-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-700">
              {actionError}
            </p>

            <button
              type="button"
              onClick={() =>
                setActionError(
                  "",
                )
              }
              className="shrink-0 text-red-400 hover:text-red-600"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* TASK OVERVIEW */}

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Task
              </p>

              <h1 className="mt-1 text-2xl font-bold text-slate-800">
                {task.title}
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
                {task.description ||
                  "No description provided."}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${statusClasses(
                  task.status,
                )}`}
              >
                {formatLabel(
                  task.status,
                )}
              </span>

              <span
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${priorityClasses(
                  task.priority,
                )}`}
              >
                {formatLabel(
                  task.priority,
                )}
              </span>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-slate-400">
                <WorkflowIcon
                  size={16}
                />

                <span className="text-xs">
                  Workflow
                </span>
              </div>

              <p className="mt-2 text-sm font-semibold text-slate-700">
                {workflow.name}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-slate-400">
                <GitBranch
                  size={16}
                />

                <span className="text-xs">
                  Stage
                </span>
              </div>

              <p className="mt-2 text-sm font-semibold text-slate-700">
                {currentStage
                  ?.name ??
                  "No stage"}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-slate-400">
                <UserRound
                  size={16}
                />

                <span className="text-xs">
                  Assignee
                </span>
              </div>

              <p className="mt-2 text-sm font-semibold text-slate-700">
                {task.assigned_to_name ??
                  "Unassigned"}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-slate-400">
                <CalendarDays
                  size={16}
                />

                <span className="text-xs">
                  Due date
                </span>
              </div>

              <p className="mt-2 text-sm font-semibold text-slate-700">
                {task.due_date
                  ? new Date(
                      `${task.due_date}T00:00:00`,
                    ).toLocaleDateString()
                  : "No due date"}
              </p>
            </div>
          </div>
        </section>

        {/* STATUS + DETAILS */}

        <div className="grid gap-5 xl:grid-cols-3">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="font-bold text-slate-800">
                  Task Status
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  {taskIsCompleted
                    ? "Completed tasks are locked from normal status changes."
                    : "Update the current execution state."}
                </p>
              </div>

              {!taskIsCompleted && (
                <select
                  value={
                    task.status
                  }
                  disabled={
                    updatingStatus ||
                    task.status ===
                      "PENDING_APPROVAL"
                  }
                  onChange={(
                    event,
                  ) =>
                    void handleStatusChange(
                      event
                        .target
                        .value as TaskStatus,
                    )
                  }
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium outline-none transition focus:border-blue-400 disabled:cursor-not-allowed disabled:bg-slate-100"
                >
                  <option value="TODO">
                    To Do
                  </option>

                  <option value="IN_PROGRESS">
                    In Progress
                  </option>

                  <option value="COMPLETED">
                    Completed
                  </option>

                  <option value="CANCELLED">
                    Cancelled
                  </option>
                </select>
              )}
            </div>

            {taskIsCompleted && (
              <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-700">
                      <LockKeyhole
                        size={20}
                      />
                    </div>

                    <div>
                      <p className="font-semibold text-emerald-800">
                        Completed
                      </p>

                      <p className="mt-1 max-w-xl text-sm leading-6 text-emerald-700">
                        This task has been completed and is locked.
                        Its status cannot be reversed through the
                        normal status control.
                      </p>
                    </div>
                  </div>

                  {isAdministrator && (
                    <button
                      type="button"
                      onClick={
                        openReopenModal
                      }
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                    >
                      <RotateCcw
                        size={16}
                      />

                      Reopen Task
                    </button>
                  )}
                </div>

                {!isAdministrator && (
                  <p className="mt-4 text-xs text-emerald-700">
                    Only an Administrator can reopen a completed task.
                  </p>
                )}
              </div>
            )}

            {/* DEPENDENCIES */}

            <div className="mt-7">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-700">
                    Dependencies
                  </h3>

                  <p className="mt-1 text-xs text-slate-400">
                    Tasks that must be completed first
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    openDependencyModal
                  }
                  disabled={
                    availableDependencyTasks
                      .length === 0
                  }
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus
                    size={14}
                  />

                  Add Dependency
                </button>
              </div>

              {dependencyTasks.length ===
              0 ? (
                <div className="mt-4 rounded-xl border border-dashed border-slate-200 p-6 text-center">
                  <GitBranch
                    size={28}
                    className="mx-auto text-slate-300"
                  />

                  <p className="mt-2 text-sm text-slate-400">
                    This task has no dependencies.
                  </p>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {dependencyTasks.map(
                    ({
                      dependency,
                      task:
                        dependencyTask,
                    }) => {
                      const complete =
                        dependencyTask.status ===
                        "COMPLETED";

                      return (
                        <div
                          key={
                            dependency.id
                          }
                          className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 p-4"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              navigate(
                                `/tasks/${dependencyTask.id}`,
                              )
                            }
                            className="flex min-w-0 flex-1 items-center gap-3 text-left"
                          >
                            {complete ? (
                              <CheckCircle2
                                size={18}
                                className="shrink-0 text-emerald-500"
                              />
                            ) : (
                              <Circle
                                size={18}
                                className="shrink-0 text-amber-500"
                              />
                            )}

                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-700">
                                {
                                  dependencyTask.title
                                }
                              </p>

                              <p className="mt-1 text-xs text-slate-400">
                                {formatLabel(
                                  dependencyTask.status,
                                )}
                              </p>
                            </div>
                          </button>

                          <div className="flex items-center gap-3">
                            <span className="text-xs text-slate-400">
                              {complete
                                ? "Completed"
                                : "Blocking"}
                            </span>

                            <button
                              type="button"
                              disabled={
                                deletingDependencyId ===
                                dependency.id
                              }
                              onClick={() =>
                                void handleDeleteDependency(
                                  dependency,
                                )
                              }
                              className="rounded-lg p-2 text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                              title="Remove dependency"
                            >
                              <Trash2
                                size={15}
                              />
                            </button>
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              )}
            </div>
          </section>

          {/* DETAILS */}

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-bold text-slate-800">
              Details
            </h2>

            <div className="mt-5 space-y-5">
              <div>
                <p className="text-xs text-slate-400">
                  Created by
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-700">
                  {task.created_by_name ||
                    "—"}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-400">
                  Created
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-700">
                  {new Date(
                    task.created_at,
                  ).toLocaleString()}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-400">
                  Completed
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-700">
                  {task.completed_at
                    ? new Date(
                        task.completed_at,
                      ).toLocaleString()
                    : "—"}
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* APPROVALS */}

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck
                  size={19}
                  className="text-violet-500"
                />

                <h2 className="font-bold text-slate-800">
                  Approvals
                </h2>
              </div>

              <p className="mt-1 text-xs text-slate-400">
                Approval requests for this task
              </p>
            </div>

            {!pendingApproval &&
              task.status !==
                "COMPLETED" &&
              task.status !==
                "CANCELLED" && (
                <button
                  type="button"
                  onClick={() =>
                    void openApprovalModal()
                  }
                  className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Request Approval
                </button>
              )}
          </div>

          {approvals.length ===
          0 ? (
            <div className="flex min-h-36 items-center justify-center text-center">
              <div>
                <Clock3
                  size={28}
                  className="mx-auto text-slate-300"
                />

                <p className="mt-2 text-sm text-slate-400">
                  No approval requests yet.
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {approvals.map(
                (approval) => (
                  <div
                    key={
                      approval.id
                    }
                    className="rounded-xl border border-slate-100 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-700">
                          Approver:{" "}
                          {approval.approver_name ||
                            "—"}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          Requested by{" "}
                          {approval.requested_by_name ||
                            "—"}
                        </p>
                      </div>

                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                        {formatLabel(
                          approval.status,
                        )}
                      </span>
                    </div>

                    {approval.comment && (
                      <p className="mt-3 text-sm leading-6 text-slate-500">
                        {
                          approval.comment
                        }
                      </p>
                    )}

                    <p className="mt-3 text-xs text-slate-400">
                      {new Date(
                        approval.requested_at,
                      ).toLocaleString()}
                    </p>
                  </div>
                ),
              )}
            </div>
          )}
        </section>
      </div>

      {/* DEPENDENCY MODAL */}

      {dependencyModalOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="font-bold text-slate-800">
                  Add Dependency
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  Select a task that must be completed first.
                </p>
              </div>

              <button
                type="button"
                disabled={
                  submittingDependency
                }
                onClick={() =>
                  setDependencyModalOpen(
                    false,
                  )
                }
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={
                handleAddDependency
              }
              className="space-y-5 p-5"
            >
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Dependency task
                </label>

                <select
                  required
                  value={
                    selectedDependencyTask
                  }
                  onChange={(
                    event,
                  ) =>
                    setSelectedDependencyTask(
                      event.target
                        .value,
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400"
                >
                  <option value="">
                    Select task
                  </option>

                  {availableDependencyTasks.map(
                    (task) => (
                      <option
                        key={
                          task.id
                        }
                        value={
                          task.id
                        }
                      >
                        {task.title} —{" "}
                        {formatLabel(
                          task.status,
                        )}
                      </option>
                    ),
                  )}
                </select>

                {availableDependencyTasks.length ===
                  0 && (
                  <p className="mt-2 text-xs text-slate-400">
                    No other available tasks exist in this workflow.
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  disabled={
                    submittingDependency
                  }
                  onClick={() =>
                    setDependencyModalOpen(
                      false,
                    )
                  }
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    submittingDependency ||
                    !selectedDependencyTask
                  }
                  className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {submittingDependency
                    ? "Adding..."
                    : "Add Dependency"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* APPROVAL MODAL */}

      {approvalModalOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="font-bold text-slate-800">
                  Request Approval
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  Assign this task to an approver.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setApprovalModalOpen(
                    false,
                  )
                }
                disabled={
                  submittingApproval
                }
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={
                handleRequestApproval
              }
              className="space-y-4 p-5"
            >
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Approver
                </label>

                <select
                  required
                  value={
                    approverId
                  }
                  onChange={(
                    event,
                  ) =>
                    setApproverId(
                      event.target
                        .value,
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400"
                >
                  <option value="">
                    Select approver
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

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Comment
                </label>

                <textarea
                  value={
                    approvalComment
                  }
                  onChange={(
                    event,
                  ) =>
                    setApprovalComment(
                      event.target
                        .value,
                    )
                  }
                  rows={3}
                  placeholder="Optional comment"
                  className="mt-2 w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() =>
                    setApprovalModalOpen(
                      false,
                    )
                  }
                  disabled={
                    submittingApproval
                  }
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    submittingApproval ||
                    !approverId
                  }
                  className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {submittingApproval
                    ? "Requesting..."
                    : "Request Approval"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REOPEN TASK MODAL */}

      {reopenModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-amber-100 p-2.5 text-amber-700">
                  <AlertTriangle
                    size={20}
                  />
                </div>

                <div>
                  <h2 className="font-bold text-slate-800">
                    Reopen completed task
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    The task will return to In Progress.
                    This action will be recorded in the audit log.
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={
                  reopeningTask
                }
                onClick={
                  closeReopenModal
                }
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={
                handleReopenTask
              }
              className="space-y-5 p-5"
            >
              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Reason for reopening
                </label>

                <p className="mt-1 text-xs text-slate-400">
                  A reason is required so there is a clear record of why the completed task was reopened.
                </p>

                <textarea
                  required
                  autoFocus
                  value={
                    reopenReason
                  }
                  onChange={(
                    event,
                  ) =>
                    setReopenReason(
                      event.target
                        .value,
                    )
                  }
                  rows={4}
                  placeholder="For example: The submitted document was incomplete."
                  className="mt-3 w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-amber-400"
                />
              </div>

              <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
                <div className="flex gap-3">
                  <RotateCcw
                    size={17}
                    className="mt-0.5 shrink-0 text-amber-600"
                  />

                  <div>
                    <p className="text-sm font-semibold text-amber-800">
                      What happens next?
                    </p>

                    <p className="mt-1 text-xs leading-5 text-amber-700">
                      The task changes from Completed to In Progress and its completion timestamp is cleared.
                      If the workflow was already completed, it may return to Active.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  disabled={
                    reopeningTask
                  }
                  onClick={
                    closeReopenModal
                  }
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    reopeningTask ||
                    !reopenReason.trim()
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RotateCcw
                    size={15}
                  />

                  {reopeningTask
                    ? "Reopening..."
                    : "Reopen Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}