import api from "./axios";

export type WorkflowStatus =
  | "DRAFT"
  | "ACTIVE"
  | "COMPLETED"
  | "ARCHIVED";

export type WorkflowItem = {
  id: string;
  name: string;
  description: string;
  created_by: string;
  created_by_name: string;
  status: WorkflowStatus;
  start_date: string | null;
  end_date: string | null;
  task_count: number;
  created_at: string;
  updated_at: string;
};

export type CreateWorkflowPayload = {
  name: string;
  description?: string;
  status?: WorkflowStatus;
  start_date?: string | null;
  end_date?: string | null;
};

export type UpdateWorkflowPayload =
  Partial<CreateWorkflowPayload>;

type WorkflowListResponse =
  | WorkflowItem[]
  | {
      results: WorkflowItem[];
      count?: number;
      next?: string | null;
      previous?: string | null;
    };

export async function getWorkflows() {
  const response =
    await api.get<WorkflowListResponse>(
      "/workflows/",
    );

  return Array.isArray(response.data)
    ? response.data
    : response.data.results;
}

export async function getWorkflow(
  workflowId: string,
) {
  const response =
    await api.get<WorkflowItem>(
      `/workflows/${workflowId}/`,
    );

  return response.data;
}

export async function createWorkflow(
  payload: CreateWorkflowPayload,
) {
  const response =
    await api.post<WorkflowItem>(
      "/workflows/",
      payload,
    );

  return response.data;
}

export async function updateWorkflow(
  workflowId: string,
  payload: UpdateWorkflowPayload,
) {
  const response =
    await api.patch<WorkflowItem>(
      `/workflows/${workflowId}/`,
      payload,
    );

  return response.data;
}

export async function archiveWorkflow(
  workflowId: string,
) {
  await api.delete(
    `/workflows/${workflowId}/`,
  );
}