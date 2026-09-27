import api from "./axios";

import type {
  WorkflowItem,
} from "./workflows.api";

import type {
  WorkflowTask,
} from "./workflow-details.api";

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
): T[] {
  return Array.isArray(data)
    ? data
    : data.results;
}

export async function getSearchTasks() {
  const response =
    await api.get<
      ListResponse<WorkflowTask>
    >("/tasks/");

  return extractResults(
    response.data,
  );
}

export async function getSearchWorkflows() {
  const response =
    await api.get<
      ListResponse<WorkflowItem>
    >("/workflows/");

  return extractResults(
    response.data,
  );
}