import {
  useState,
} from "react";

import {
  Eye,
  EyeOff,
} from "lucide-react";

import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  useAuth,
} from "../context/AuthContext";

import {
  useSettings,
} from "../context/SettingsContext";

import AuthShell from "../components/auth/AuthShell";

export default function LoginPage() {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const {
    login,
  } =
    useAuth();

  const {
    settings,
  } =
    useSettings();

  const successMessage =
    location.state?.message ??
    "";

  const [
    email,
    setEmail,
  ] =
    useState("");

  const [
    password,
    setPassword,
  ] =
    useState("");

  const [
    showPassword,
    setShowPassword,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    submitting,
    setSubmitting,
  ] =
    useState(false);

  async function handleSubmit(
    event:
      React.FormEvent,
  ) {
    event.preventDefault();

    setError("");
    setSubmitting(
      true,
    );

    try {
      await login({
        email,
        password,
      });

      navigate(
        settings.landingPage,
      );
    } catch (
      err: any
    ) {
      const message =
        err?.response?.data?.detail ??
        err?.response?.data?.error
          ?.message ??
        err?.response?.data
          ?.non_field_errors?.[0] ??
        "Unable to log in.";

      setError(
        message,
      );
    } finally {
      setSubmitting(
        false,
      );
    }
  }

  return (
    <AuthShell>
      <form
        onSubmit={
          handleSubmit
        }
        className="w-full max-w-md rounded-[28px] border border-white/15 bg-white/[0.08] p-8 shadow-2xl backdrop-blur-2xl"
      >
        <h2 className="text-3xl font-bold text-white">
          Welcome back
        </h2>

        <p className="mt-2 text-sm text-slate-300">
          Sign in to your WMS account
        </p>

        {successMessage && (
          <div className="mt-5 rounded-xl bg-green-500/10 p-3 text-sm text-green-200">
            {
              successMessage
            }
          </div>
        )}

        {error && (
          <div className="mt-5 rounded-xl bg-red-500/10 p-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="mt-7">
          <label className="text-sm font-medium text-slate-200">
            Email
          </label>

          <input
            type="email"
            value={
              email
            }
            onChange={(
              event,
            ) =>
              setEmail(
                event.target
                  .value,
              )
            }
            required
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-400 focus:border-blue-400"
          />
        </div>

        <div className="mt-5">
          <div className="flex justify-between">
            <label className="text-sm font-medium text-slate-200">
              Password
            </label>

            <Link
              to="/forgot-password"
              className="text-sm font-medium text-blue-300"
            >
              Forgot password?
            </Link>
          </div>

          <div className="relative mt-2">
            <input
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              value={
                password
              }
              onChange={(
                event,
              ) =>
                setPassword(
                  event.target
                    .value,
                )
              }
              required
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pr-12 text-white outline-none placeholder:text-slate-400 focus:border-blue-400"
            />

            <button
              type="button"
              onClick={() =>
                setShowPassword(
                  (
                    value,
                  ) =>
                    !value,
                )
              }
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
            >
              {showPassword ? (
                <EyeOff
                  size={
                    18
                  }
                />
              ) : (
                <Eye
                  size={
                    18
                  }
                />
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={
            submitting
          }
          className="mt-6 w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
        >
          {submitting
            ? "Signing in..."
            : "Sign In"}
        </button>

        <p className="mt-6 text-center text-sm text-slate-300">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="font-semibold text-blue-300"
          >
            Register
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}