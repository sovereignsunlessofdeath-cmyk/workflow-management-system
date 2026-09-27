import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import AuthShell from "../components/auth/AuthShell";
import { registerUser } from "../api/auth.api";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function updateField(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  async function handleSubmit(
    event: React.FormEvent,
  ) {
    event.preventDefault();

    setError("");
    setSubmitting(true);

    try {
      const response = await registerUser(form);

      navigate("/login", {
        state: {
          message: response.message,
        },
      });
    } catch (err: any) {
      const data = err?.response?.data;

      setError(
        data?.email?.[0] ??
          data?.password?.[0] ??
          data?.first_name?.[0] ??
          data?.last_name?.[0] ??
          data?.error?.message ??
          "Registration failed.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg rounded-[28px] border border-white/15 bg-white/[0.08] p-8 shadow-2xl backdrop-blur-2xl"
      >
        <h1 className="text-3xl font-bold text-white">
          Create your account
        </h1>

        <p className="mt-2 text-sm text-slate-300">
          Join your organization's workflow workspace.
        </p>

        {error && (
          <div className="mt-5 rounded-xl bg-red-500/10 p-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          <input
            name="first_name"
            value={form.first_name}
            onChange={updateField}
            placeholder="First name"
            required
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-400 focus:border-blue-400"
          />

          <input
            name="last_name"
            value={form.last_name}
            onChange={updateField}
            placeholder="Last name"
            required
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-400 focus:border-blue-400"
          />
        </div>

        <input
          name="email"
          type="email"
          value={form.email}
          onChange={updateField}
          placeholder="Email"
          required
          className="mt-4 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-400 focus:border-blue-400"
        />

        <input
          name="password"
          type="password"
          value={form.password}
          onChange={updateField}
          placeholder="Password"
          minLength={8}
          required
          className="mt-4 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-400 focus:border-blue-400"
        />

        <button
          type="submit"
          disabled={submitting}
          className="mt-6 w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
        >
          {submitting
            ? "Creating account..."
            : "Create Account"}
        </button>

        <p className="mt-6 text-center text-sm text-slate-300">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-blue-300"
          >
            Sign in
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}