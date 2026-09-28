import api from "./axios";

import type {
  WorkflowItem,
} from "./workflows.api";

export type WorkflowStage = {
  id: string;
  workflow: string;
  name: string;
  description: string;
  order: number;
  task_count: number;
  created_at: string;
  updated_at: string;
};

export type TaskDependency = {
  id: string;
  task: string;
  depends_on: string;
  depends_on_title: string;
  created_at: string;
};

export type TaskStatus =
  | "TODO"
  | "IN_PROGRESS"
  | "PENDING_APPROVAL"
  | "COMPLETED"
  | "CANCELLED";

export type TaskPriority =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "URGENT";

export type WorkflowTask = {
  id: string;
  workflow: string;
  stage: string | null;
  title: string;
  description: string;
  created_by: string;
  created_by_name: string;
  assigned_to: string | null;
  assigned_to_name: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ApprovalStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED";

export type ApprovalItem = {
  id: string;
  task: string;
  task_title: string;
  requested_by: string;
  requested_by_name: string;
  approver: string;
  approver_name: string;
  status: ApprovalStatus;
  comment: string;
  requested_at: string;
  decided_at: string | null;
};

type ListResponse<T> =
  | T[]
  | {
      results: T[];
      count?: number;
      next?: string | null;
      previous?: string | null;
    };

function extractResults<T>(
  data: ListResponse<T>,
) {
  return Array.isArray(data)
    ? data
    : data.results;
}

export async function getWorkflowDetail(
  workflowId: string,
) {
  const response =
    await api.get<WorkflowItem>(
      `/workflows/${workflowId}/`,
    );

  return response.data;
}

export async function getWorkflowStages(
  workflowId: string,
) {
  const response =
    await api.get<
      ListResponse<WorkflowStage>
    >("/workflow-stages/");

  return extractResults(
    response.data,
  )
    .filter(
      (stage) =>
        stage.workflow ===
        workflowId,
    )
    .sort(
      (a, b) =>
        a.order - b.order,
    );
}

export async function getWorkflowTasks(
  workflowId: string,
) {
  const response =
    await api.get<
      ListResponse<WorkflowTask>
    >("/tasks/");

  return extractResults(
    response.data,
  ).filter(
    (task) =>
      task.workflow ===
      workflowId,
  );
}

export async function getTask(
  taskId: string,
) {
  const response =
    await api.get<WorkflowTask>(
      `/tasks/${taskId}/`,
    );

  return response.data;
}

export async function updateTask(
  taskId: string,
  payload: Partial<{
    workflow: string;
    stage: string | null;
    title: string;
    description: string;
    assigned_to: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    due_date: string | null;
  }>,
) {
  const response =
    await api.patch<WorkflowTask>(
      `/tasks/${taskId}/`,
      payload,
    );

  return response.data;
}

export async function reopenTask(
  taskId: string,
  reason: string,
) {
  const response =
    await api.post<WorkflowTask>(
      `/tasks/${taskId}/reopen/`,
      {
        reason,
      },
    );

  return response.data;
}

export async function permanentlyDeleteTask(
  taskId: string,
) {
  await api.delete(
    `/tasks/${taskId}/permanent-delete/`,
  );
}

export async function getTaskDependencies() {
  const response =
    await api.get<
      ListResponse<TaskDependency>
    >("/task-dependencies/");

  return extractResults(
    response.data,
  );
}

export async function createTaskDependency(
  payload: {
    task: string;
    depends_on: string;
  },
) {
  const response =
    await api.post<TaskDependency>(
      "/task-dependencies/",
      payload,
    );

  return response.data;
}

export async function deleteTaskDependency(
  dependencyId: string,
) {
  await api.delete(
    `/task-dependencies/${dependencyId}/`,
  );
}

export async function getApprovals() {
  const response =
    await api.get<
      ListResponse<ApprovalItem>
    >("/approvals/");

  return extractResults(
    response.data,
  );
}

export async function createApproval(
  payload: {
    task: string;
    approver: string;
    comment?: string;
  },
) {
  const response =
    await api.post<ApprovalItem>(
      "/approvals/",
      payload,
    );

  return response.data;
}

export async function decideApproval(
  approvalId: string,
  payload: {
    status:
      | "APPROVED"
      | "REJECTED";
    comment?: string;
  },
) {
  const response =
    await api.post<ApprovalItem>(
      `/approvals/${approvalId}/decision/`,
      payload,
    );

  return response.data;
}

export async function createWorkflowStage(
  payload: {
    workflow: string;
    name: string;
    description?: string;
    order: number;
  },
) {
  const response =
    await api.post<WorkflowStage>(
      "/workflow-stages/",
      payload,
    );

  return response.data;
}

export async function deleteWorkflowStage(
  stageId: string,
) {
  await api.delete(
    `/workflow-stages/${stageId}/`,
  );
}

export type CreateTaskPayload = {
  workflow: string;
  stage?: string | null;
  title: string;
  description?: string;
  assigned_to?: string | null;
  priority: TaskPriority;
  due_date?: string | null;
};

export async function createWorkflowTask(
  payload: CreateTaskPayload,
) {
  const response =
    await api.post<WorkflowTask>(
      "/tasks/",
      payload,
    );

  return response.data;
}