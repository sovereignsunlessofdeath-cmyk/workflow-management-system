import {
  Navigate,
  Outlet,
} from "react-router-dom";

import {
  useAuth,
} from "../context/AuthContext";

import type {
  UserRole,
} from "../types/auth";


type RoleRouteProps = {
  allowedRoles: UserRole[];
};


export default function RoleRoute({
  allowedRoles,
}: RoleRouteProps) {
  const {
    user,
    loading,
  } =
    useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-slate-500">
          Loading...
        </p>
      </div>
    );
  }

  if (
    !user ||
    !allowedRoles.includes(
      user.role,
    )
  ) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  return <Outlet />;
}