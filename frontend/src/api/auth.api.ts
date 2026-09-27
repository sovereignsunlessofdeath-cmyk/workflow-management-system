import api from "./axios";
import type {
  LoginRequest,
  LoginResponse,
  MeResponse,
  RegisterRequest,
  AdminRegisterRequest,
  RegisterResponse,
} from "../types/auth";

export async function registerUser(payload: RegisterRequest) {
  const response = await api.post<RegisterResponse>(
    "/auth/register/",
    payload,
  );

  return response.data;
}

export async function registerAdmin(
  payload: AdminRegisterRequest,
) {
  const response =
    await api.post<RegisterResponse>(
      "/auth/admin-register/",
      payload,
    );

  return response.data;
}

export async function loginUser(payload: LoginRequest) {
  const response = await api.post<LoginResponse>(
    "/auth/login/",
    payload,
  );

  return response.data;
}

export async function getCurrentUser() {
  const response = await api.get<MeResponse>(
    "/auth/me/",
  );

  return response.data;
}

export async function logoutUser(refresh: string) {
  const response = await api.post(
    "/auth/logout/",
    {
      refresh,
    },
  );

  return response.data;
}

export async function forgotPassword(email: string) {
  const response = await api.post(
    "/auth/forgot-password/",
    {
      email,
    },
  );

  return response.data;
}

export async function resetPassword(
  token: string,
  newPassword: string,
) {
  const response = await api.post(
    "/auth/reset-password/",
    {
      token,
      new_password: newPassword,
    },
  );

  return response.data;
}

export async function verifyEmail(token: string) {
  const response = await api.get(
    `/auth/verify-email/${token}/`,
  );

  return response.data;
}