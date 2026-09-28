import {
  CalendarDays,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  ScrollText,
  Settings,
  SquareCheckBig,
  Users,
  Workflow,
} from "lucide-react";

import {
  NavLink,
  useNavigate,
} from "react-router-dom";

import {
  useAuth,
} from "../../context/AuthContext";

import type {
  UserRole,
} from "../../types/auth";


type SidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
};


type MenuItem = {
  label: string;
  icon: typeof LayoutDashboard;
  path: string;
  roles?: UserRole[];
};


const menuItems: MenuItem[] = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard",
  },
  {
    label: "Workflows",
    icon: Workflow,
    path: "/workflows",
  },
  {
    label: "My Tasks",
    icon: SquareCheckBig,
    path: "/tasks",
  },
  {
    label: "Approvals",
    icon: CheckCheck,
    path: "/approvals",
  },
  {
    label: "Calendar",
    icon: CalendarDays,
    path: "/calendar",
  },
  {
    label: "Audit Log",
    icon: ScrollText,
    path: "/audit-log",
    roles: [
      "ADMINISTRATOR",
    ],
  },
  {
    label: "Users",
    icon: Users,
    path: "/users",
    roles: [
      "ADMINISTRATOR",
    ],
  },
  {
    label: "Settings",
    icon: Settings,
    path: "/settings",
  },
];


export default function Sidebar({
  collapsed,
  onToggle,
}: SidebarProps) {
  const navigate =
    useNavigate();

  const {
    logout,
    user,
  } =
    useAuth();


  async function handleLogout() {
    await logout();

    navigate(
      "/login",
    );
  }


  const visibleMenuItems =
    menuItems.filter(
      (item) => {
        if (!item.roles) {
          return true;
        }

        if (!user) {
          return false;
        }

        return item.roles.includes(
          user.role,
        );
      },
    );


  return (
    <aside
      className={`wms-sidebar fixed inset-y-0 left-0 z-50 hidden overflow-hidden text-white transition-all duration-300 ease-out lg:flex lg:flex-col ${
        collapsed
          ? "w-20"
          : "w-60"
      }`}
    >
      <div
        className={`relative z-10 flex h-24 items-center ${
          collapsed
            ? "justify-center"
            : "justify-between px-5"
        }`}
      >
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-white/10 shadow-lg shadow-blue-950/20 backdrop-blur">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/25 via-cyan-400/10 to-violet-500/25" />

              <Workflow
                size={23}
                className="relative text-white"
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white">
                  WMS
                </h1>

                <span className="rounded-full border border-blue-300/15 bg-blue-400/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-blue-200">
                  Suite
                </span>
              </div>

              <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                Workflow Management
              </p>
            </div>
          </div>
        )}

        {collapsed && (
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 shadow-lg backdrop-blur">
            <Workflow
              size={22}
              className="text-white"
            />
          </div>
        )}
      </div>

      <div className="relative z-10 px-4">
        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      <nav className="relative z-10 flex flex-1 flex-col gap-1.5 overflow-y-auto px-3 py-5">
        {!collapsed && (
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Workspace
          </p>
        )}

        {visibleMenuItems.map(
          (item) => {
            const Icon =
              item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                title={
                  collapsed
                    ? item.label
                    : undefined
                }
                className={({
                  isActive,
                }) =>
                  [
                    "group relative flex h-12 items-center overflow-hidden rounded-2xl transition-all duration-200",
                    collapsed
                      ? "justify-center"
                      : "gap-3 px-3.5",
                    isActive
                      ? "bg-white/[0.11] text-white shadow-lg shadow-black/10 ring-1 ring-inset ring-white/[0.08]"
                      : "text-slate-400 hover:bg-white/[0.065] hover:text-white",
                  ].join(
                    " ",
                  )
                }
              >
                {({
                  isActive,
                }) => (
                  <>
                    {isActive && (
                      <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-gradient-to-b from-cyan-400 to-blue-500 shadow-[0_0_14px_rgba(59,130,246,0.6)]" />
                    )}

                    <span
                      className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition ${
                        isActive
                          ? "bg-blue-500/15 text-blue-200"
                          : "text-slate-400 group-hover:bg-white/[0.06] group-hover:text-white"
                      }`}
                    >
                      <Icon
                        size={19}
                      />
                    </span>

                    {!collapsed && (
                      <span className="relative text-[13px] font-medium">
                        {item.label}
                      </span>
                    )}

                    {!collapsed &&
                      isActive && (
                        <span className="absolute right-3 h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_9px_rgba(34,211,238,0.7)]" />
                      )}
                  </>
                )}
              </NavLink>
            );
          },
        )}
      </nav>

      <div className="relative z-10 px-3 pb-3">
        <button
          type="button"
          onClick={onToggle}
          className={`flex h-11 w-full items-center rounded-2xl border border-white/[0.07] bg-white/[0.045] text-slate-400 transition hover:border-white/10 hover:bg-white/[0.08] hover:text-white ${
            collapsed
              ? "justify-center"
              : "gap-3 px-3"
          }`}
          title={
            collapsed
              ? "Expand sidebar"
              : "Collapse sidebar"
          }
        >
          {collapsed ? (
            <ChevronRight
              size={18}
            />
          ) : (
            <>
              <ChevronLeft
                size={18}
              />

              <span className="text-xs font-medium">
                Collapse sidebar
              </span>
            </>
          )}
        </button>
      </div>

      <div className="relative z-10 border-t border-white/[0.07] px-3 py-4">
        <button
          type="button"
          onClick={handleLogout}
          title={
            collapsed
              ? "Logout"
              : undefined
          }
          className={`group flex h-12 w-full items-center rounded-2xl text-slate-400 transition duration-200 hover:bg-red-500/10 hover:text-red-200 ${
            collapsed
              ? "justify-center"
              : "gap-3 px-3.5"
          }`}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-xl transition group-hover:bg-red-400/10">
            <LogOut
              size={18}
            />
          </span>

          {!collapsed && (
            <span className="text-[13px] font-medium">
              Logout
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}