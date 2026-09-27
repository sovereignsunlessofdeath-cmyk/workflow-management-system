import { useState } from "react";
import { Link } from "react-router-dom";

import AuthShell from "../components/auth/AuthShell";
import { forgotPassword } from "../api/auth.api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(
    event: React.FormEvent,
  ) {
    event.preventDefault();

    setMessage("");
    setError("");
    setSubmitting(true);

    try {
      const response = await forgotPassword(email);
      setMessage(response.message);
    } catch {
      setError(
        "Unable to process your password reset request.",
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
          Forgot password?
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-300">
          Enter your account email and we'll send you a reset link.
        </p>

        {message && (
          <div className="mt-5 rounded-xl bg-green-500/10 p-3 text-sm text-green-200">
            {message}
          </div>
        )}

        {error && (
          <div className="mt-5 rounded-xl bg-red-500/10 p-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <input
          type="email"
          value={email}
          onChange={(event) =>
            setEmail(event.target.value)
          }
          placeholder="Email"
          required
          className="mt-7 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-400 focus:border-blue-400"
        />

        <button
          type="submit"
          disabled={submitting}
          className="mt-5 w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
        >
          {submitting
            ? "Sending..."
            : "Send Reset Link"}
        </button>

        <Link
          to="/login"
          className="mt-6 block text-center text-sm font-medium text-blue-300"
        >
          Back to login
        </Link>
      </form>
    </AuthShell>
  );
}