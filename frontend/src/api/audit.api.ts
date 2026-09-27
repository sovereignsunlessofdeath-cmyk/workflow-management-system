import api from "./axios";

export type AuditLogItem = {
  id: string;
  actor: string | null;
  actor_email: string | null;

  action: string;

  target_type: string;
  target_id: string;

  description: string;

  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;

  metadata: Record<string, unknown>;

  ip_address: string | null;
  user_agent: string;

  created_at: string;
};

type AuditLogListResponse =
  | AuditLogItem[]
  | {
      results: AuditLogItem[];
      count?: number;
      next?: string | null;
      previous?: string | null;
    };

function extractResults(
  data: AuditLogListResponse,
): AuditLogItem[] {
  return Array.isArray(data)
    ? data
    : data.results;
}

export async function getAuditLogs() {
  const response =
    await api.get<AuditLogListResponse>(
      "/audit-logs/",
    );

  return extractResults(
    response.data,
  );
}

export async function getAuditLog(
  auditId: string,
) {
  const response =
    await api.get<AuditLogItem>(
      `/audit-logs/${auditId}/`,
    );

  return response.data;
}