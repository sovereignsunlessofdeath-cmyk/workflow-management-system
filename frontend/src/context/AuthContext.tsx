import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  getCurrentUser,
  loginUser,
  logoutUser,
} from "../api/auth.api";

import type {
  LoginRequest,
  User,
} from "../types/auth";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      const accessToken = localStorage.getItem("access_token");

      if (!accessToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await getCurrentUser();
        setUser(response.data);
      } catch {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
      } finally {
        setLoading(false);
      }
    }

    restoreSession();
  }, []);

  async function login(payload: LoginRequest) {
    const response = await loginUser(payload);

    localStorage.setItem(
      "access_token",
      response.data.access,
    );

    localStorage.setItem(
      "refresh_token",
      response.data.refresh,
    );

    setUser(response.data.user);
  }

  async function logout() {
    const refreshToken =
      localStorage.getItem("refresh_token");

    try {
      if (refreshToken) {
        await logoutUser(refreshToken);
      }
    } finally {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: Boolean(user),
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider",
    );
  }

  return context;
}