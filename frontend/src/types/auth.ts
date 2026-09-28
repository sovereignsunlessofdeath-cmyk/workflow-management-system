export type UserRole =
  | "STAFF"
  | "APPROVER"
  | "MANAGER"
  | "ADMINISTRATOR";

export type User = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: UserRole;
  status: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
};

export type AdminRegisterRequest = {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  admin_pin: string;
};

export type AuthTokens = {
  access: string;
  refresh: string;
};

export type LoginResponse = {
  data: {
    access: string;
    refresh: string;
    user: User;
  };
  message: string;
};

export type RegisterResponse = {
  data: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  message: string;
};

export type MeResponse = {
  data: User;
  message: string;
};

export type MessageResponse = {
  data: Record<string, never>;
  message: string;
};