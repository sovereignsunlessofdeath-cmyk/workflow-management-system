import {
  Plus,
  RefreshCw,
  Search,
  UserRound,
  X,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Header from "../components/layout/Header";

import {
  createUser,
  deactivateUser,
  getUsers,
  updateUser,
  type UserItem,
  type UserRole,
  type UserStatus,
} from "../api/users.api";

type UserFormState = {
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  status: UserStatus;
  password: string;
};

const initialForm: UserFormState = {
  email: "",
  first_name: "",
  last_name: "",
  role: "STAFF",
  status: "ACTIVE",
  password: "",
};

function formatLabel(
  value: string,
) {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
}

function roleClasses(
  role: UserRole,
) {
  switch (role) {
    case "ADMINISTRATOR":
      return "bg-violet-50 text-violet-700";

    case "MANAGER":
      return "bg-blue-50 text-blue-700";

    case "APPROVER":
      return "bg-amber-50 text-amber-700";

    default:
      return "bg-slate-100 text-slate-600";
  }
}

export default function UsersPage() {
  const [users, setUsers] =
    useState<UserItem[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [modalOpen, setModalOpen] =
    useState(false);

  const [
    editingUser,
    setEditingUser,
  ] = useState<UserItem | null>(
    null,
  );

  const [form, setForm] =
    useState<UserFormState>(
      initialForm,
    );

  const [submitting, setSubmitting] =
    useState(false);

  const loadUsers =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const result =
          await getUsers();

        setUsers(result);
      } catch (err) {
        console.error(
          "Unable to load users:",
          err,
        );

        setError(
          "Unable to load users.",
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const filteredUsers =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return users;
      }

      return users.filter(
        (user) =>
          user.full_name
            .toLowerCase()
            .includes(query) ||
          user.email
            .toLowerCase()
            .includes(query) ||
          user.role
            .toLowerCase()
            .includes(query) ||
          user.status
            .toLowerCase()
            .includes(query),
      );
    }, [users, search]);

  function openCreateModal() {
    setEditingUser(null);
    setForm(initialForm);
    setModalOpen(true);
  }

  function openEditModal(
    user: UserItem,
  ) {
    setEditingUser(user);

    setForm({
      email: user.email,
      first_name:
        user.first_name,
      last_name:
        user.last_name,
      role: user.role,
      status: user.status,
      password: "",
    });

    setModalOpen(true);
  }

  function closeModal() {
    if (submitting) {
      return;
    }

    setModalOpen(false);
    setEditingUser(null);
    setForm(initialForm);
  }

  function updateField(
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLSelectElement>,
  ) {
    const {
      name,
      value,
    } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(
    event: React.FormEvent,
  ) {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError("");

      if (editingUser) {
        const updated =
          await updateUser(
            editingUser.id,
            {
              email:
                form.email.trim(),
              first_name:
                form.first_name.trim(),
              last_name:
                form.last_name.trim(),
              role: form.role,
              status: form.status,
            },
          );

        setUsers(
          (current) =>
            current.map(
              (user) =>
                user.id ===
                updated.id
                  ? updated
                  : user,
            ),
        );
      } else {
        const created =
          await createUser({
            email:
              form.email.trim(),
            first_name:
              form.first_name.trim(),
            last_name:
              form.last_name.trim(),
            role: form.role,
            status: form.status,
            password:
              form.password,
          });

        setUsers(
          (current) => [
            created,
            ...current,
          ],
        );
      }

      setModalOpen(false);
      setEditingUser(null);
      setForm(initialForm);
    } catch (err: any) {
      console.error(
        "Unable to save user:",
        err,
      );

      setError(
        err?.response?.data
          ?.email?.[0] ??
          err?.response?.data
            ?.password?.[0] ??
          err?.response?.data
            ?.detail ??
          "Unable to save user.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeactivate(
    user: UserItem,
  ) {
    const confirmed =
      window.confirm(
        `Deactivate "${user.full_name || user.email}"?`,
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await deactivateUser(
        user.id,
      );

      setUsers(
        (current) =>
          current.map(
            (item) =>
              item.id === user.id
                ? {
                    ...item,
                    status:
                      "INACTIVE",
                    is_active:
                      false,
                  }
                : item,
          ),
      );
    } catch (err: any) {
      console.error(
        "Unable to deactivate user:",
        err,
      );

      setError(
        err?.response?.data
          ?.detail ??
          "Unable to deactivate user.",
      );
    }
  }

  return (
    <>
      <Header
        title="Users"
        subtitle="Manage users, roles and account status"
      />

      <div className="space-y-5 p-4 md:p-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-md">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder="Search users..."
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-400"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  void loadUsers()
                }
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                <RefreshCw
                  size={15}
                />

                Refresh
              </button>

              <button
                type="button"
                onClick={
                  openCreateModal
                }
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <Plus size={16} />

                Create User
              </button>
            </div>
          </div>
        </section>

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
              className="text-red-400"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(
              (item) => (
                <div
                  key={item}
                  className="h-20 animate-pulse rounded-2xl bg-white"
                />
              ),
            )}
          </div>
        ) : filteredUsers.length ===
          0 ? (
          <div className="flex min-h-72 items-center justify-center rounded-2xl border border-slate-200 bg-white text-center shadow-sm">
            <div>
              <UserRound
                size={36}
                className="mx-auto text-slate-300"
              />

              <p className="mt-3 text-sm text-slate-400">
                No users found.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left">
                <thead className="border-b border-slate-100 bg-slate-50">
                  <tr className="text-xs text-slate-500">
                    <th className="px-5 py-4 font-semibold">
                      User
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Role
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Status
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Created
                    </th>

                    <th className="px-5 py-4 text-right font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredUsers.map(
                    (user) => (
                      <tr
                        key={
                          user.id
                        }
                        className="border-b border-slate-100 last:border-b-0"
                      >
                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold text-slate-800">
                            {user.full_name ||
                              "—"}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {
                              user.email
                            }
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${roleClasses(
                              user.role,
                            )}`}
                          >
                            {formatLabel(
                              user.role,
                            )}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              user.status ===
                              "ACTIVE"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {formatLabel(
                              user.status,
                            )}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-500">
                          {new Date(
                            user.created_at,
                          ).toLocaleString()}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                openEditModal(
                                  user,
                                )
                              }
                              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                            >
                              Edit
                            </button>

                            {user.status !==
                              "INACTIVE" && (
                              <button
                                type="button"
                                onClick={() =>
                                  void handleDeactivate(
                                    user,
                                  )
                                }
                                className="rounded-lg border border-red-100 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                              >
                                Deactivate
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  {editingUser
                    ? "Edit User"
                    : "Create User"}
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  Manage account details and role.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeModal
                }
                disabled={
                  submitting
                }
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={
                handleSubmit
              }
              className="space-y-4 p-6"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    First name
                  </label>

                  <input
                    name="first_name"
                    value={
                      form.first_name
                    }
                    onChange={
                      updateField
                    }
                    required
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Last name
                  </label>

                  <input
                    name="last_name"
                    value={
                      form.last_name
                    }
                    onChange={
                      updateField
                    }
                    required
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Email
                </label>

                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={
                    updateField
                  }
                  required
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400"
                />
              </div>

              {!editingUser && (
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Password
                  </label>

                  <input
                    type="password"
                    name="password"
                    value={
                      form.password
                    }
                    onChange={
                      updateField
                    }
                    required
                    minLength={8}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400"
                  />
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Role
                  </label>

                  <select
                    name="role"
                    value={form.role}
                    onChange={
                      updateField
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400"
                  >
                    <option value="STAFF">
                      Staff
                    </option>

                    <option value="APPROVER">
                      Approver
                    </option>

                    <option value="MANAGER">
                      Manager
                    </option>

                    <option value="ADMINISTRATOR">
                      Administrator
                    </option>
                  </select>
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
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400"
                  >
                    <option value="ACTIVE">
                      Active
                    </option>

                    <option value="INACTIVE">
                      Inactive
                    </option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={
                    closeModal
                  }
                  disabled={
                    submitting
                  }
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    submitting
                  }
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {submitting
                    ? "Saving..."
                    : editingUser
                      ? "Save Changes"
                      : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}