import { useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import AuthShell from "../components/auth/AuthShell";
import { resetPassword } from "../api/auth.api";

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(
    event: React.FormEvent,
  ) {
    event.preventDefault();

    if (!token) {
      setError("Invalid password reset link.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      const response = await resetPassword(
        token,
        password,
      );

      navigate("/login", {
        state: {
          message: response.message,
        },
      });
    } catch (err: any) {
      setError(
        err?.response?.data?.error?.message ??
          err?.response?.data?.new_password?.[0] ??
          "Password reset failed.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-[28px] border border-white/15 bg-white/[0.08] p-8 shadow-2xl backdrop-blur-2xl"
      >
        <h1 className="text-3xl font-bold text-white">
          Create new password
        </h1>

        <p className="mt-2 text-sm text-slate-300">
          Choose a new password for your WMS account.
        </p>

        {error && (
          <div className="mt-5 rounded-xl bg-red-500/10 p-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <input
          type="password"
          value={password}
          onChange={(event) =>
            setPassword(event.target.value)
          }
          minLength={8}
          placeholder="New password"
          required
          className="mt-7 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-400 focus:border-blue-400"
        />

        <input
          type="password"
          value={confirmPassword}
          onChange={(event) =>
            setConfirmPassword(event.target.value)
          }
          placeholder="Confirm new password"
          required
          className="mt-4 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-400 focus:border-blue-400"
        />

        <button
          type="submit"
          disabled={submitting}
          className="mt-5 w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
        >
          {submitting
            ? "Resetting..."
            : "Reset Password"}
        </button>

        <Link
          to="/login"
          className="mt-6 block text-center text-sm text-blue-300"
        >
          Back to login
        </Link>
      </form>
    </AuthShell>
  );
}