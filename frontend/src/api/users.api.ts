import api from "./axios";

export type UserRole =
  | "ADMINISTRATOR"
  | "MANAGER"
  | "APPROVER"
  | "STAFF";

export type UserStatus =
  | "ACTIVE"
  | "INACTIVE";

export type UserItem = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: UserRole;
  status: UserStatus;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type UserListResponse =
  | UserItem[]
  | {
      results: UserItem[];
      count?: number;
      next?: string | null;
      previous?: string | null;
    };

function extractResults(
  data: UserListResponse,
) {
  return Array.isArray(data)
    ? data
    : data.results;
}

export async function getUsers() {
  const response =
    await api.get<UserListResponse>(
      "/users/",
    );

  return extractResults(
    response.data,
  );
}

export async function getAssignableUsers() {
  const response =
    await api.get<UserItem[]>(
      "/users/assignable/",
    );

  return response.data;
}

export type CreateUserPayload = {
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  status: UserStatus;
  password: string;
};

export async function createUser(
  payload: CreateUserPayload,
) {
  const response =
    await api.post<UserItem>(
      "/users/",
      payload,
    );

  return response.data;
}

export type UpdateUserPayload = Partial<{
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  status: UserStatus;
}>;

export async function updateUser(
  userId: string,
  payload: UpdateUserPayload,
) {
  const response =
    await api.patch<UserItem>(
      `/users/${userId}/`,
      payload,
    );

  return response.data;
}

export async function deactivateUser(
  userId: string,
) {
  await api.delete(
    `/users/${userId}/`,
  );
}