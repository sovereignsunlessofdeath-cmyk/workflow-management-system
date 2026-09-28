import {
  Archive,
  CalendarDays,
  Plus,
  RefreshCw,
  Search,
  Workflow as WorkflowIcon,
  X,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import Header from "../components/layout/Header";

import {
  useAuth,
} from "../context/AuthContext";

import {
  archiveWorkflow,
  createWorkflow,
  getWorkflows,
  updateWorkflow,
  type WorkflowItem,
  type WorkflowStatus,
} from "../api/workflows.api";


type WorkflowFormState = {
  name: string;
  description: string;
  status: WorkflowStatus;
  start_date: string;
  end_date: string;
};


const initialForm: WorkflowFormState = {
  name: "",
  description: "",
  status: "DRAFT",
  start_date: "",
  end_date: "",
};


function statusClasses(
  status: WorkflowStatus,
) {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-50 text-emerald-700";

    case "COMPLETED":
      return "bg-blue-50 text-blue-700";

    case "ARCHIVED":
      return "bg-slate-100 text-slate-600";

    default:
      return "bg-amber-50 text-amber-700";
  }
}


export default function WorkflowsPage() {
  const navigate =
    useNavigate();

  const {
    user,
  } =
    useAuth();


  const canManageWorkflows =
    user?.role ===
      "ADMINISTRATOR" ||
    user?.role ===
      "MANAGER";


  const [
    workflows,
    setWorkflows,
  ] =
    useState<
      WorkflowItem[]
    >([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    modalOpen,
    setModalOpen,
  ] =
    useState(false);

  const [
    editingWorkflow,
    setEditingWorkflow,
  ] =
    useState<
      WorkflowItem | null
    >(null);

  const [
    form,
    setForm,
  ] =
    useState<
      WorkflowFormState
    >(
      initialForm,
    );

  const [
    submitting,
    setSubmitting,
  ] =
    useState(false);


  const loadWorkflows =
    useCallback(
      async () => {
        try {
          setLoading(
            true,
          );

          setError(
            "",
          );

          const result =
            await getWorkflows();

          setWorkflows(
            result,
          );
        } catch (err) {
          console.error(
            "Unable to load workflows:",
            err,
          );

          setError(
            "Unable to load workflows.",
          );
        } finally {
          setLoading(
            false,
          );
        }
      },
      [],
    );


  useEffect(() => {
    void loadWorkflows();
  }, [
    loadWorkflows,
  ]);


  const filteredWorkflows =
    useMemo(
      () => {
        const query =
          search
            .trim()
            .toLowerCase();

        if (!query) {
          return workflows;
        }

        return workflows.filter(
          (
            workflow,
          ) =>
            workflow.name
              .toLowerCase()
              .includes(
                query,
              ) ||
            workflow.description
              .toLowerCase()
              .includes(
                query,
              ) ||
            workflow.status
              .toLowerCase()
              .includes(
                query,
              ),
        );
      },
      [
        workflows,
        search,
      ],
    );


  function openCreateModal() {
    if (
      !canManageWorkflows
    ) {
      return;
    }

    setEditingWorkflow(
      null,
    );

    setForm(
      initialForm,
    );

    setModalOpen(
      true,
    );
  }


  function openEditModal(
    workflow:
      WorkflowItem,
  ) {
    if (
      !canManageWorkflows
    ) {
      return;
    }

    setEditingWorkflow(
      workflow,
    );

    setForm({
      name:
        workflow.name,

      description:
        workflow.description,

      status:
        workflow.status,

      start_date:
        workflow.start_date ??
        "",

      end_date:
        workflow.end_date ??
        "",
    });

    setModalOpen(
      true,
    );
  }


  function closeModal() {
    if (
      submitting
    ) {
      return;
    }

    setModalOpen(
      false,
    );

    setEditingWorkflow(
      null,
    );

    setForm(
      initialForm,
    );
  }


  function updateField(
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>,
  ) {
    const {
      name,
      value,
    } =
      event.target;

    setForm(
      (
        current,
      ) => ({
        ...current,
        [name]:
          value,
      }),
    );
  }


  async function handleSubmit(
    event:
      React.FormEvent,
  ) {
    event.preventDefault();

    if (
      !canManageWorkflows
    ) {
      setError(
        "You do not have permission to manage workflows.",
      );

      return;
    }

    try {
      setSubmitting(
        true,
      );

      setError(
        "",
      );

      const payload = {
        name:
          form.name.trim(),

        description:
          form.description.trim(),

        status:
          form.status,

        start_date:
          form.start_date ||
          null,

        end_date:
          form.end_date ||
          null,
      };


      if (
        editingWorkflow
      ) {
        const updated =
          await updateWorkflow(
            editingWorkflow.id,
            payload,
          );

        setWorkflows(
          (
            current,
          ) =>
            current.map(
              (
                workflow,
              ) =>
                workflow.id ===
                updated.id
                  ? updated
                  : workflow,
            ),
        );
      } else {
        const created =
          await createWorkflow(
            payload,
          );

        setWorkflows(
          (
            current,
          ) => [
            created,
            ...current,
          ],
        );
      }

      closeModal();
    } catch (
      err: any
    ) {
      console.error(
        "Workflow save failed:",
        err,
      );

      setError(
        err?.response
          ?.data
          ?.detail ??
        err?.response
          ?.data
          ?.name?.[0] ??
        err?.response
          ?.data
          ?.non_field_errors?.[0] ??
        "Unable to save workflow.",
      );
    } finally {
      setSubmitting(
        false,
      );
    }
  }


  async function handleArchive(
    workflow:
      WorkflowItem,
  ) {
    if (
      !canManageWorkflows
    ) {
      setError(
        "You do not have permission to archive workflows.",
      );

      return;
    }

    const confirmed =
      window.confirm(
        `Archive "${workflow.name}"?`,
      );

    if (
      !confirmed
    ) {
      return;
    }

    try {
      await archiveWorkflow(
        workflow.id,
      );

      setWorkflows(
        (
          current,
        ) =>
          current.map(
            (
              item,
            ) =>
              item.id ===
              workflow.id
                ? {
                    ...item,
                    status:
                      "ARCHIVED",
                  }
                : item,
          ),
      );
    } catch (
      err
    ) {
      console.error(
        "Unable to archive workflow:",
        err,
      );

      setError(
        "Unable to archive workflow.",
      );
    }
  }


  return (
    <>
      <Header
        title="Workflows"
        subtitle={
          canManageWorkflows
            ? "Create, manage and monitor workflow processes"
            : "View and monitor workflow processes"
        }
      />

      <div className="space-y-5 p-4 md:p-6">
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-md">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              value={
                search
              }
              onChange={(
                event,
              ) =>
                setSearch(
                  event
                    .target
                    .value,
                )
              }
              placeholder="Search workflows..."
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-400"
            />
          </div>

          {canManageWorkflows && (
            <button
              type="button"
              onClick={
                openCreateModal
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <Plus
                size={
                  17
                }
              />

              Create Workflow
            </button>
          )}
        </div>


        {error && (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}


        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[
              1,
              2,
              3,
            ].map(
              (
                item,
              ) => (
                <div
                  key={
                    item
                  }
                  className="h-56 animate-pulse rounded-2xl border border-slate-200 bg-white"
                />
              ),
            )}
          </div>
        ) : filteredWorkflows.length ===
          0 ? (
          <div className="flex min-h-96 items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div>
              <WorkflowIcon
                size={38}
                className="mx-auto text-slate-300"
              />

              <h2 className="mt-4 text-lg font-semibold text-slate-700">
                No workflows found
              </h2>

              <p className="mt-2 text-sm text-slate-400">
                {canManageWorkflows
                  ? "Create a workflow to get started."
                  : "No workflows are currently available."}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredWorkflows.map(
              (
                workflow,
              ) => (
                <article
                  key={
                    workflow.id
                  }
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/workflows/${workflow.id}`,
                          )
                        }
                        className="block max-w-full text-left"
                      >
                        <h2 className="truncate text-lg font-bold text-slate-800 transition hover:text-blue-600">
                          {
                            workflow.name
                          }
                        </h2>
                      </button>

                      <p className="mt-1 text-xs text-slate-400">
                        Created by{" "}
                        {
                          workflow.created_by_name
                        }
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses(
                        workflow.status,
                      )}`}
                    >
                      {
                        workflow.status
                      }
                    </span>
                  </div>


                  <p className="mt-4 min-h-12 text-sm leading-6 text-slate-500">
                    {workflow.description ||
                      "No description provided."}
                  </p>


                  <div className="mt-5 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-3">
                    <div>
                      <p className="text-xs text-slate-400">
                        Tasks
                      </p>

                      <p className="mt-1 font-semibold text-slate-700">
                        {
                          workflow.task_count
                        }
                      </p>
                    </div>

                    <CalendarDays
                      size={
                        18
                      }
                      className="text-slate-400"
                    />
                  </div>


                  {canManageWorkflows && (
                    <div className="mt-5 flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          openEditModal(
                            workflow,
                          )
                        }
                        className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        Edit
                      </button>

                      {workflow.status !==
                        "ARCHIVED" && (
                        <button
                          type="button"
                          onClick={() =>
                            void handleArchive(
                              workflow,
                            )
                          }
                          className="inline-flex items-center justify-center rounded-xl border border-red-100 px-3 text-red-600 transition hover:bg-red-50"
                          title="Archive workflow"
                        >
                          <Archive
                            size={
                              17
                            }
                          />
                        </button>
                      )}
                    </div>
                  )}
                </article>
              ),
            )}
          </div>
        )}


        {!loading &&
          filteredWorkflows.length >
            0 && (
            <button
              type="button"
              onClick={() =>
                void loadWorkflows()
              }
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-700"
            >
              <RefreshCw
                size={
                  15
                }
              />

              Refresh
            </button>
          )}
      </div>


      {modalOpen &&
        canManageWorkflows && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
            <div className="w-full max-w-xl rounded-[28px] border border-slate-200 bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">
                    {editingWorkflow
                      ? "Edit Workflow"
                      : "Create Workflow"}
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    Configure the workflow
                    details below.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    closeModal
                  }
                  className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                >
                  <X
                    size={
                      20
                    }
                  />
                </button>
              </div>


              <form
                onSubmit={
                  handleSubmit
                }
                className="space-y-5 p-6"
              >
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Workflow name
                  </label>

                  <input
                    name="name"
                    value={
                      form.name
                    }
                    onChange={
                      updateField
                    }
                    required
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400"
                  />
                </div>


                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Description
                  </label>

                  <textarea
                    name="description"
                    value={
                      form.description
                    }
                    onChange={
                      updateField
                    }
                    rows={
                      4
                    }
                    className="mt-2 w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400"
                  />
                </div>


                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-slate-700">
                      Start date
                    </label>

                    <input
                      name="start_date"
                      type="date"
                      value={
                        form.start_date
                      }
                      onChange={
                        updateField
                      }
                      className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400"
                    />
                  </div>


                  <div>
                    <label className="text-sm font-medium text-slate-700">
                      End date
                    </label>

                    <input
                      name="end_date"
                      type="date"
                      value={
                        form.end_date
                      }
                      onChange={
                        updateField
                      }
                      className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400"
                    />
                  </div>
                </div>


                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Status
                  </label>

                  <select
                    name="status"
                    value={
                      form.status
                    }
                    onChange={
                      updateField
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400"
                  >
                    <option value="DRAFT">
                      Draft
                    </option>

                    <option value="ACTIVE">
                      Active
                    </option>

                    <option value="COMPLETED">
                      Completed
                    </option>

                    <option value="ARCHIVED">
                      Archived
                    </option>
                  </select>
                </div>


                <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                  <button
                    type="button"
                    onClick={
                      closeModal
                    }
                    className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={
                      submitting
                    }
                    className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                  >
                    {submitting
                      ? "Saving..."
                      : editingWorkflow
                        ? "Save Changes"
                        : "Create Workflow"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </>
  );
}