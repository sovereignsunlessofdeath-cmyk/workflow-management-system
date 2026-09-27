import {
  CheckCircle2,
  Clock3,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
  XCircle,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

import Header from "../components/layout/Header";

import {
  decideApproval,
  getApprovals,
  type ApprovalItem,
  type ApprovalStatus,
} from "../api/workflow-details.api";

type FilterStatus =
  | "ALL"
  | ApprovalStatus;

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
}

function statusClasses(
  status: ApprovalStatus,
) {
  switch (status) {
    case "APPROVED":
      return "border-emerald-100 bg-emerald-50 text-emerald-700";

    case "REJECTED":
      return "border-red-100 bg-red-50 text-red-700";

    default:
      return "border-amber-100 bg-amber-50 text-amber-700";
  }
}

export default function ApprovalsPage() {
  const navigate = useNavigate();

  const { user } = useAuth();

  const [
    approvals,
    setApprovals,
  ] = useState<ApprovalItem[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [
    filterStatus,
    setFilterStatus,
  ] =
    useState<FilterStatus>(
      "ALL",
    );

  const [
    decidingId,
    setDecidingId,
  ] = useState<string | null>(
    null,
  );

  const [
    rejectModalOpen,
    setRejectModalOpen,
  ] = useState(false);

  const [
    rejectionApproval,
    setRejectionApproval,
  ] =
    useState<ApprovalItem | null>(
      null,
    );

  const [
    rejectionComment,
    setRejectionComment,
  ] = useState("");

  const loadApprovals =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const result =
          await getApprovals();

        setApprovals(result);
      } catch (err) {
        console.error(
          "Unable to load approvals:",
          err,
        );

        setError(
          "Unable to load approvals.",
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    void loadApprovals();
  }, [loadApprovals]);

  const pendingCount =
    useMemo(
      () =>
        approvals.filter(
          (approval) =>
            approval.status ===
            "PENDING",
        ).length,
      [approvals],
    );

  const approvedCount =
    useMemo(
      () =>
        approvals.filter(
          (approval) =>
            approval.status ===
            "APPROVED",
        ).length,
      [approvals],
    );

  const rejectedCount =
    useMemo(
      () =>
        approvals.filter(
          (approval) =>
            approval.status ===
            "REJECTED",
        ).length,
      [approvals],
    );

  const filteredApprovals =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return approvals.filter(
        (approval) => {
          const statusMatches =
            filterStatus ===
              "ALL" ||
            approval.status ===
              filterStatus;

          const searchMatches =
            !query ||
            approval.task_title
              .toLowerCase()
              .includes(query) ||
            (
              approval.approver_name ??
              ""
            )
              .toLowerCase()
              .includes(query) ||
            (
              approval.requested_by_name ??
              ""
            )
              .toLowerCase()
              .includes(query) ||
            approval.status
              .toLowerCase()
              .includes(query) ||
            (
              approval.comment ??
              ""
            )
              .toLowerCase()
              .includes(query);

          return (
            statusMatches &&
            searchMatches
          );
        },
      );
    }, [
      approvals,
      filterStatus,
      search,
    ]);

  function updateApproval(
    updated: ApprovalItem,
  ) {
    setApprovals(
      (current) =>
        current.map(
          (approval) =>
            approval.id ===
            updated.id
              ? updated
              : approval,
        ),
    );
  }

  function canDecideApproval(
    approval: ApprovalItem,
  ) {
    if (
      user?.role ===
      "ADMINISTRATOR"
    ) {
      return true;
    }

    if (
      user?.role ===
        "APPROVER" &&
      approval.approver ===
        user.id
    ) {
      return true;
    }

    return false;
  }

  async function handleApprove(
    approval: ApprovalItem,
  ) {
    if (
      !canDecideApproval(
        approval,
      )
    ) {
      setError(
        "You do not have permission to decide this approval.",
      );

      return;
    }

    const confirmed =
      window.confirm(
        `Approve "${approval.task_title}"?`,
      );

    if (!confirmed) {
      return;
    }

    try {
      setDecidingId(
        approval.id,
      );

      setError("");

      const updated =
        await decideApproval(
          approval.id,
          {
            status:
              "APPROVED",
          },
        );

      updateApproval(updated);
    } catch (err: any) {
      console.error(
        "Unable to approve request:",
        err,
      );

      setError(
        err?.response?.data
          ?.detail ??
          err?.response?.data
            ?.non_field_errors?.[0] ??
          "Unable to approve this request.",
      );
    } finally {
      setDecidingId(null);
    }
  }

  function openRejectModal(
    approval: ApprovalItem,
  ) {
    if (
      !canDecideApproval(
        approval,
      )
    ) {
      setError(
        "You do not have permission to decide this approval.",
      );

      return;
    }

    setError("");

    setRejectionApproval(
      approval,
    );

    setRejectionComment("");

    setRejectModalOpen(
      true,
    );
  }

  function closeRejectModal() {
    if (decidingId) {
      return;
    }

    setRejectModalOpen(
      false,
    );

    setRejectionApproval(
      null,
    );

    setRejectionComment("");
  }

  async function handleReject(
    event: React.FormEvent,
  ) {
    event.preventDefault();

    if (
      !rejectionApproval ||
      !rejectionComment.trim()
    ) {
      return;
    }

    if (
      !canDecideApproval(
        rejectionApproval,
      )
    ) {
      setError(
        "You do not have permission to decide this approval.",
      );

      return;
    }

    try {
      setDecidingId(
        rejectionApproval.id,
      );

      setError("");

      const updated =
        await decideApproval(
          rejectionApproval.id,
          {
            status:
              "REJECTED",
            comment:
              rejectionComment.trim(),
          },
        );

      updateApproval(updated);

      setRejectModalOpen(
        false,
      );

      setRejectionApproval(
        null,
      );

      setRejectionComment("");
    } catch (err: any) {
      console.error(
        "Unable to reject request:",
        err,
      );

      setError(
        err?.response?.data
          ?.detail ??
          err?.response?.data
            ?.comment?.[0] ??
          err?.response?.data
            ?.non_field_errors?.[0] ??
          "Unable to reject this request.",
      );
    } finally {
      setDecidingId(null);
    }
  }

  return (
    <>
      <Header
        title="Approvals"
        subtitle="Review and manage approval requests"
      />

      <div className="space-y-5 p-4 md:p-6">
        {/* SUMMARY */}

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Clock3
                  size={19}
                />
              </div>

              <div>
                <p className="text-xs text-slate-400">
                  Pending
                </p>

                <p className="text-2xl font-bold text-slate-800">
                  {pendingCount}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2
                  size={19}
                />
              </div>

              <div>
                <p className="text-xs text-slate-400">
                  Approved
                </p>

                <p className="text-2xl font-bold text-slate-800">
                  {approvedCount}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
                <XCircle
                  size={19}
                />
              </div>

              <div>
                <p className="text-xs text-slate-400">
                  Rejected
                </p>

                <p className="text-2xl font-bold text-slate-800">
                  {rejectedCount}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* SEARCH / FILTER */}

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target
                      .value,
                  )
                }
                placeholder="Search approvals..."
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-400"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {(
                [
                  "ALL",
                  "PENDING",
                  "APPROVED",
                  "REJECTED",
                ] as FilterStatus[]
              ).map(
                (status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() =>
                      setFilterStatus(
                        status,
                      )
                    }
                    className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                      filterStatus ===
                      status
                        ? "bg-blue-600 text-white"
                        : "border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    {formatLabel(
                      status,
                    )}
                  </button>
                ),
              )}

              <button
                type="button"
                onClick={() =>
                  void loadApprovals()
                }
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-500 transition hover:bg-slate-50"
              >
                <RefreshCw
                  size={14}
                />

                Refresh
              </button>
            </div>
          </div>
        </section>

        {/* ERROR */}

        {error && (
          <div className="flex items-center justify-between rounded-xl border border-red-100 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
              className="text-red-400 hover:text-red-600"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* LIST */}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(
              (item) => (
                <div
                  key={item}
                  className="h-40 animate-pulse rounded-2xl border border-slate-200 bg-white"
                />
              ),
            )}
          </div>
        ) : filteredApprovals.length ===
          0 ? (
          <div className="flex min-h-80 items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div>
              <ShieldCheck
                size={38}
                className="mx-auto text-slate-300"
              />

              <h2 className="mt-4 text-lg font-semibold text-slate-700">
                No approvals found
              </h2>

              <p className="mt-2 text-sm text-slate-400">
                Approval requests will
                appear here when they
                are created.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredApprovals.map(
              (approval) => {
                const canDecide =
                  canDecideApproval(
                    approval,
                  );

                return (
                  <article
                    key={
                      approval.id
                    }
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              navigate(
                                `/tasks/${approval.task}`,
                              )
                            }
                            className="truncate text-left text-base font-bold text-slate-800 transition hover:text-blue-600"
                          >
                            {
                              approval.task_title
                            }
                          </button>

                          <span
                            className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusClasses(
                              approval.status,
                            )}`}
                          >
                            {formatLabel(
                              approval.status,
                            )}
                          </span>
                        </div>

                        <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
                          <div>
                            <p className="text-xs text-slate-400">
                              Requested by
                            </p>

                            <p className="mt-1 font-semibold text-slate-700">
                              {approval.requested_by_name ||
                                "—"}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-slate-400">
                              Approver
                            </p>

                            <p className="mt-1 font-semibold text-slate-700">
                              {approval.approver_name ||
                                "—"}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-slate-400">
                              Requested
                            </p>

                            <p className="mt-1 font-semibold text-slate-700">
                              {new Date(
                                approval.requested_at,
                              ).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        {approval.comment && (
                          <div className="mt-4 rounded-xl bg-slate-50 p-3">
                            <p className="text-xs text-slate-400">
                              Comment
                            </p>

                            <p className="mt-1 text-sm leading-6 text-slate-600">
                              {
                                approval.comment
                              }
                            </p>
                          </div>
                        )}

                        {approval.decided_at && (
                          <p className="mt-3 text-xs text-slate-400">
                            Decision made{" "}
                            {new Date(
                              approval.decided_at,
                            ).toLocaleString()}
                          </p>
                        )}
                      </div>

                      {approval.status ===
                        "PENDING" &&
                        canDecide && (
                          <div className="flex shrink-0 gap-2">
                            <button
                              type="button"
                              disabled={
                                decidingId ===
                                approval.id
                              }
                              onClick={() =>
                                void handleApprove(
                                  approval,
                                )
                              }
                              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                            >
                              <CheckCircle2
                                size={
                                  16
                                }
                              />

                              Approve
                            </button>

                            <button
                              type="button"
                              disabled={
                                decidingId ===
                                approval.id
                              }
                              onClick={() =>
                                openRejectModal(
                                  approval,
                                )
                              }
                              className="inline-flex items-center gap-2 rounded-xl border border-red-100 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                            >
                              <XCircle
                                size={
                                  16
                                }
                              />

                              Reject
                            </button>
                          </div>
                        )}

                      {approval.status ===
                        "PENDING" &&
                        !canDecide && (
                          <div className="shrink-0 rounded-xl bg-amber-50 px-4 py-2.5 text-xs font-semibold text-amber-700">
                            Awaiting approver decision
                          </div>
                        )}
                    </div>
                  </article>
                );
              },
            )}
          </div>
        )}
      </div>

      {/* REJECT MODAL */}

      {rejectModalOpen &&
        rejectionApproval && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div>
                  <h2 className="font-bold text-slate-800">
                    Reject Approval
                  </h2>

                  <p className="mt-1 text-xs text-slate-400">
                    A rejection comment
                    is required.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    closeRejectModal
                  }
                  disabled={
                    decidingId !==
                    null
                  }
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100"
                >
                  <X size={18} />
                </button>
              </div>

              <form
                onSubmit={
                  handleReject
                }
                className="space-y-4 p-5"
              >
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-400">
                    Task
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-700">
                    {
                      rejectionApproval.task_title
                    }
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Rejection comment
                  </label>

                  <textarea
                    required
                    value={
                      rejectionComment
                    }
                    onChange={(
                      event,
                    ) =>
                      setRejectionComment(
                        event.target
                          .value,
                      )
                    }
                    rows={4}
                    placeholder="Explain why this request is being rejected"
                    className="mt-2 w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-red-400"
                  />
                </div>

                <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={
                      closeRejectModal
                    }
                    disabled={
                      decidingId !==
                      null
                    }
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={
                      decidingId !==
                        null ||
                      !rejectionComment.trim()
                    }
                    className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                  >
                    {decidingId
                      ? "Rejecting..."
                      : "Reject Approval"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </>
  );
}