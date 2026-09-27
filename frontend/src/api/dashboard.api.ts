import api from "./axios";

export type CountByRole = {
  role: string;
  count: number;
};

export type CountByStatus = {
  status: string;
  count: number;
};

export type CountByPriority = {
  priority: string;
  count: number;
};

export type CountByWorkflow = {
  workflow_id: string;
  workflow__name: string;
  count: number;
};

export type DashboardSummary = {
  users: {
    total: number | null;
    active: number | null;
    by_role: CountByRole[];
  };

  workflows: {
    total: number;
    draft: number;
    active: number;
    completed: number;
    archived: number;
  };

  tasks: {
    total: number;
    todo: number;
    in_progress: number;
    pending_approval: number;
    completed: number;
    cancelled: number;
    overdue: number;
    due_soon: number;
  };

  tasks_by_priority: CountByPriority[];

  approvals: {
    pending: number;
    approved: number;
    rejected: number;
  };

  notifications: {
    unread: number;
  };
};

export type TaskStatistics = {
  by_status: CountByStatus[];
  by_priority: CountByPriority[];
  by_workflow: CountByWorkflow[];
};

export type WorkflowStatistics = {
  id: string;
  name: string;
  status: string;
  total_tasks: number;
  completed_tasks: number;
  progress_percentage: number;
};

export type RecentActivity = {
  id: string;
  actor: string | null;
  action: string;
  target_type: string;
  target_id: string;
  description: string;
  created_at: string;
};

export async function getDashboardSummary() {
  const response =
    await api.get<DashboardSummary>(
      "/dashboard/",
    );

  return response.data;
}

export async function getTaskStatistics() {
  const response =
    await api.get<TaskStatistics>(
      "/dashboard/tasks/",
    );

  return response.data;
}

export async function getWorkflowStatistics() {
  const response =
    await api.get<WorkflowStatistics[]>(
      "/dashboard/workflows/",
    );

  return response.data;
}

export async function getRecentActivity(
  limit = 10,
) {
  const response =
    await api.get<RecentActivity[]>(
      "/dashboard/recent-activity/",
      {
        params: {
          limit,
        },
      },
    );

  return response.data;
}