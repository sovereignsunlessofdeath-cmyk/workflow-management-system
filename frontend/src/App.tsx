import {
  Route,
  Routes,
} from "react-router-dom";

import AppLayout from "./components/layout/AppLayout";

import ProtectedRoute from "./router/ProtectedRoute";
import EntryRoute from "./router/EntryRoute";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";

import SplashPage from "./pages/SplashPage";

import DashboardPage from "./pages/DashboardPage";

import WorkflowsPage from "./pages/WorkflowsPage";
import WorkflowDetailPage from "./pages/WorkflowDetailPage";

import TasksPage from "./pages/TasksPage";
import TaskDetailPage from "./pages/TaskDetailPage";

import ApprovalsPage from "./pages/ApprovalsPage";
import CalendarPage from "./pages/CalendarPage";
import AuditLogPage from "./pages/AuditLogPage";
import UsersPage from "./pages/UsersPage";
import SettingsPage from "./pages/SettingsPage";
import NotificationsPage from "./pages/NotificationsPage";

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={<EntryRoute />}
      />

      <Route
        path="/splash"
        element={<SplashPage />}
      />

      <Route
        path="/login"
        element={<LoginPage />}
      />

      <Route
        path="/register"
        element={<RegisterPage />}
      />

      <Route
        path="/forgot-password"
        element={
          <ForgotPasswordPage />
        }
      />

      <Route
        path="/reset-password/:token"
        element={
          <ResetPasswordPage />
        }
      />

      <Route
        path="/verify-email/:token"
        element={
          <VerifyEmailPage />
        }
      />

      <Route
        element={
          <ProtectedRoute />
        }
      >
        <Route
          element={
            <AppLayout />
          }
        >
          <Route
            path="/dashboard"
            element={
              <DashboardPage />
            }
          />

          <Route
            path="/workflows"
            element={
              <WorkflowsPage />
            }
          />

          <Route
            path="/workflows/:workflowId"
            element={
              <WorkflowDetailPage />
            }
          />

          <Route
            path="/tasks"
            element={
              <TasksPage />
            }
          />

          <Route
            path="/tasks/:taskId"
            element={
              <TaskDetailPage />
            }
          />

          <Route
            path="/approvals"
            element={
              <ApprovalsPage />
            }
          />

          <Route
            path="/calendar"
            element={
              <CalendarPage />
            }
          />

          <Route
            path="/notifications"
            element={
              <NotificationsPage />
            }
          />

          <Route
            path="/audit-log"
            element={
              <AuditLogPage />
            }
          />

          <Route
            path="/users"
            element={
              <UsersPage />
            }
          />

          <Route
            path="/settings"
            element={
              <SettingsPage />
            }
          />
        </Route>
      </Route>
    </Routes>
  );
}