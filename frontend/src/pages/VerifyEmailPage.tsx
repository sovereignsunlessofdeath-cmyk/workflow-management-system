import { useEffect, useState } from "react";
import {
  CheckCircle2,
  LoaderCircle,
  XCircle,
} from "lucide-react";
import {
  Link,
  useParams,
} from "react-router-dom";

import AuthShell from "../components/auth/AuthShell";
import { verifyEmail } from "../api/auth.api";

export default function VerifyEmailPage() {
  const { token } = useParams();

  const [status, setStatus] =
    useState<"loading" | "success" | "error">(
      "loading",
    );

  const [message, setMessage] = useState("");

  useEffect(() => {
    async function runVerification() {
      if (!token) {
        setStatus("error");
        setMessage("Invalid verification link.");
        return;
      }

      try {
        const response = await verifyEmail(token);

        setMessage(response.message);
        setStatus("success");
      } catch (err: any) {
        setMessage(
          err?.response?.data?.error?.message ??
            "Email verification failed.",
        );

        setStatus("error");
      }
    }

    runVerification();
  }, [token]);

  return (
    <AuthShell>
      <div className="w-full max-w-md rounded-[28px] border border-white/15 bg-white/[0.08] p-8 text-center shadow-2xl backdrop-blur-2xl">
        {status === "loading" && (
          <>
            <LoaderCircle
              size={44}
              className="mx-auto animate-spin text-blue-300"
            />

            <h1 className="mt-5 text-2xl font-bold text-white">
              Verifying your email
            </h1>

            <p className="mt-2 text-sm text-slate-300">
              Please wait while we activate your account.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle2
              size={48}
              className="mx-auto text-green-400"
            />

            <h1 className="mt-5 text-2xl font-bold text-white">
              Email verified
            </h1>

            <p className="mt-3 text-sm text-slate-300">
              {message}
            </p>

            <Link
              to="/login"
              className="mt-6 inline-block rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white"
            >
              Continue to Login
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle
              size={48}
              className="mx-auto text-red-400"
            />

            <h1 className="mt-5 text-2xl font-bold text-white">
              Verification failed
            </h1>

            <p className="mt-3 text-sm text-slate-300">
              {message}
            </p>

            <Link
              to="/login"
              className="mt-6 inline-block text-blue-300"
            >
              Back to Login
            </Link>
          </>
        )}
      </div>
    </AuthShell>
  );
}