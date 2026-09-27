import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Flag,
  RefreshCw,
  Workflow,
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
  getCalendarTasks,
  getCalendarWorkflows,
} from "../api/calendar.api";

import type {
  WorkflowItem,
} from "../api/workflows.api";

import type {
  WorkflowTask,
} from "../api/workflow-details.api";

import {
  useAuth,
} from "../context/AuthContext";

type CalendarEventType =
  | "TASK_DUE"
  | "WORKFLOW_START"
  | "WORKFLOW_END";

type CalendarEvent = {
  id: string;
  type: CalendarEventType;
  title: string;
  date: string;
  workflowId: string | null;
  taskId: string | null;
  workflowName: string | null;
  status: string;
  priority: string | null;
};

const WEEK_DAYS = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
];

function padNumber(
  value: number,
) {
  return String(value)
    .padStart(2, "0");
}

function toDateKey(
  date: Date,
) {
  return [
    date.getFullYear(),
    padNumber(
      date.getMonth() + 1,
    ),
    padNumber(
      date.getDate(),
    ),
  ].join("-");
}

function parseDateKey(
  value: string,
) {
  const [
    year,
    month,
    day,
  ] = value
    .split("-")
    .map(Number);

  return new Date(
    year,
    month - 1,
    day,
  );
}

function formatDateLong(
  value: string,
) {
  return parseDateKey(
    value,
  ).toLocaleDateString(
    undefined,
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    },
  );
}

function formatLabel(
  value: string,
) {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase(),
    );
}

function isSameMonth(
  date: Date,
  reference: Date,
) {
  return (
    date.getFullYear() ===
      reference.getFullYear() &&
    date.getMonth() ===
      reference.getMonth()
  );
}

function getMonthDays(
  reference: Date,
) {
  const year =
    reference.getFullYear();

  const month =
    reference.getMonth();

  const firstDay =
    new Date(
      year,
      month,
      1,
    );

  const start =
    new Date(
      year,
      month,
      1 -
        firstDay.getDay(),
    );

  return Array.from(
    {
      length: 42,
    },
    (_, index) => {
      const date =
        new Date(start);

      date.setDate(
        start.getDate() +
          index,
      );

      return date;
    },
  );
}

function eventClasses(
  type: CalendarEventType,
) {
  switch (type) {
    case "TASK_DUE":
      return {
        dot:
          "bg-blue-500",
        badge:
          "border-blue-100 bg-blue-50 text-blue-700",
      };

    case "WORKFLOW_START":
      return {
        dot:
          "bg-emerald-500",
        badge:
          "border-emerald-100 bg-emerald-50 text-emerald-700",
      };

    case "WORKFLOW_END":
      return {
        dot:
          "bg-violet-500",
        badge:
          "border-violet-100 bg-violet-50 text-violet-700",
      };
  }
}

function eventTypeLabel(
  type: CalendarEventType,
) {
  switch (type) {
    case "TASK_DUE":
      return "Task Due";

    case "WORKFLOW_START":
      return "Workflow Start";

    case "WORKFLOW_END":
      return "Workflow End";
  }
}

export default function CalendarPage() {
  const navigate =
    useNavigate();

  const { user } =
    useAuth();

  const today =
    useMemo(
      () => new Date(),
      [],
    );

  const todayKey =
    toDateKey(today);

  const [
    currentMonth,
    setCurrentMonth,
  ] = useState(
    new Date(
      today.getFullYear(),
      today.getMonth(),
      1,
    ),
  );

  const [
    selectedDate,
    setSelectedDate,
  ] =
    useState<string>(
      todayKey,
    );

  const [
    workflows,
    setWorkflows,
  ] =
    useState<
      WorkflowItem[]
    >([]);

  const [
    tasks,
    setTasks,
  ] =
    useState<
      WorkflowTask[]
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

  const loadCalendar =
    useCallback(
      async () => {
        try {
          setLoading(true);
          setError("");

          const taskRequest =
            getCalendarTasks();

          const canReadWorkflows =
            user?.role ===
              "ADMINISTRATOR" ||
            user?.role ===
              "MANAGER" ||
            user?.role ===
              "APPROVER";

          const [
            taskResult,
            workflowResult,
          ] =
            await Promise.all([
              taskRequest,
              canReadWorkflows
                ? getCalendarWorkflows()
                : Promise.resolve(
                    [],
                  ),
            ]);

          setTasks(
            taskResult,
          );

          setWorkflows(
            workflowResult,
          );
        } catch (err) {
          console.error(
            "Unable to load calendar:",
            err,
          );

          setError(
            "Unable to load calendar data.",
          );
        } finally {
          setLoading(false);
        }
      },
      [user?.role],
    );

  useEffect(() => {
    void loadCalendar();
  }, [loadCalendar]);

  const workflowMap =
    useMemo(() => {
      return new Map(
        workflows.map(
          (workflow) => [
            workflow.id,
            workflow.name,
          ],
        ),
      );
    }, [workflows]);

  const events =
    useMemo<
      CalendarEvent[]
    >(() => {
      const items:
        CalendarEvent[] =
        [];

      tasks.forEach(
        (task) => {
          if (!task.due_date) {
            return;
          }

          items.push({
            id:
              `task-${task.id}`,
            type:
              "TASK_DUE",
            title:
              task.title,
            date:
              task.due_date,
            workflowId:
              task.workflow,
            taskId:
              task.id,
            workflowName:
              workflowMap.get(
                task.workflow,
              ) ?? null,
            status:
              task.status,
            priority:
              task.priority,
          });
        },
      );

      workflows.forEach(
        (workflow) => {
          if (
            workflow.start_date
          ) {
            items.push({
              id:
                `workflow-start-${workflow.id}`,
              type:
                "WORKFLOW_START",
              title:
                workflow.name,
              date:
                workflow.start_date,
              workflowId:
                workflow.id,
              taskId:
                null,
              workflowName:
                workflow.name,
              status:
                workflow.status,
              priority:
                null,
            });
          }

          if (
            workflow.end_date
          ) {
            items.push({
              id:
                `workflow-end-${workflow.id}`,
              type:
                "WORKFLOW_END",
              title:
                workflow.name,
              date:
                workflow.end_date,
              workflowId:
                workflow.id,
              taskId:
                null,
              workflowName:
                workflow.name,
              status:
                workflow.status,
              priority:
                null,
            });
          }
        },
      );

      return items.sort(
        (a, b) =>
          a.date.localeCompare(
            b.date,
          ),
      );
    }, [
      tasks,
      workflows,
      workflowMap,
    ]);

  const eventsByDate =
    useMemo(() => {
      const map =
        new Map<
          string,
          CalendarEvent[]
        >();

      events.forEach(
        (event) => {
          const existing =
            map.get(
              event.date,
            ) ?? [];

          existing.push(
            event,
          );

          map.set(
            event.date,
            existing,
          );
        },
      );

      return map;
    }, [events]);

  const monthDays =
    useMemo(
      () =>
        getMonthDays(
          currentMonth,
        ),
      [currentMonth],
    );

  const selectedEvents =
    eventsByDate.get(
      selectedDate,
    ) ?? [];

  const monthEvents =
    useMemo(() => {
      return events.filter(
        (event) => {
          const date =
            parseDateKey(
              event.date,
            );

          return isSameMonth(
            date,
            currentMonth,
          );
        },
      );
    }, [
      events,
      currentMonth,
    ]);

  const monthTaskDeadlines =
    monthEvents.filter(
      (event) =>
        event.type ===
        "TASK_DUE",
    ).length;

  const monthWorkflowStarts =
    monthEvents.filter(
      (event) =>
        event.type ===
        "WORKFLOW_START",
    ).length;

  const monthWorkflowEnds =
    monthEvents.filter(
      (event) =>
        event.type ===
        "WORKFLOW_END",
    ).length;

  const upcomingEvents =
    useMemo(() => {
      return events
        .filter(
          (event) =>
            event.date >=
            todayKey,
        )
        .slice(
          0,
          5,
        );
    }, [
      events,
      todayKey,
    ]);

  function previousMonth() {
    setCurrentMonth(
      (current) =>
        new Date(
          current.getFullYear(),
          current.getMonth() -
            1,
          1,
        ),
    );
  }

  function nextMonth() {
    setCurrentMonth(
      (current) =>
        new Date(
          current.getFullYear(),
          current.getMonth() +
            1,
          1,
        ),
    );
  }

  function goToToday() {
    setCurrentMonth(
      new Date(
        today.getFullYear(),
        today.getMonth(),
        1,
      ),
    );

    setSelectedDate(
      todayKey,
    );
  }

  function openEvent(
    event: CalendarEvent,
  ) {
    if (
      event.taskId
    ) {
      navigate(
        `/tasks/${event.taskId}`,
      );

      return;
    }

    if (
      event.workflowId
    ) {
      navigate(
        `/workflows/${event.workflowId}`,
      );
    }
  }

  return (
    <>
      <Header
        title="Calendar"
        subtitle="Task deadlines and workflow schedules"
      />

      <div className="space-y-5 p-4 md:p-6">
        {/* SUMMARY */}

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Clock3
                  size={19}
                />
              </div>

              <div>
                <p className="text-xs text-slate-400">
                  Task Deadlines
                </p>

                <p className="text-2xl font-bold text-slate-800">
                  {
                    monthTaskDeadlines
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Workflow
                  size={19}
                />
              </div>

              <div>
                <p className="text-xs text-slate-400">
                  Workflow Starts
                </p>

                <p className="text-2xl font-bold text-slate-800">
                  {
                    monthWorkflowStarts
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <Flag
                  size={19}
                />
              </div>

              <div>
                <p className="text-xs text-slate-400">
                  Workflow Ends
                </p>

                <p className="text-2xl font-bold text-slate-800">
                  {
                    monthWorkflowEnds
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

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

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          {/* CALENDAR */}

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-lg font-bold text-slate-800">
                  {currentMonth.toLocaleDateString(
                    undefined,
                    {
                      month:
                        "long",
                      year:
                        "numeric",
                    },
                  )}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Select a date to view scheduled events.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={
                    previousMonth
                  }
                  className="rounded-xl border border-slate-200 p-2.5 text-slate-500 transition hover:bg-slate-50"
                >
                  <ChevronLeft
                    size={17}
                  />
                </button>

                <button
                  type="button"
                  onClick={
                    goToToday
                  }
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Today
                </button>

                <button
                  type="button"
                  onClick={
                    nextMonth
                  }
                  className="rounded-xl border border-slate-200 p-2.5 text-slate-500 transition hover:bg-slate-50"
                >
                  <ChevronRight
                    size={17}
                  />
                </button>

                <button
                  type="button"
                  disabled={
                    loading
                  }
                  onClick={() =>
                    void loadCalendar()
                  }
                  className="rounded-xl border border-slate-200 p-2.5 text-slate-500 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  <RefreshCw
                    size={16}
                    className={
                      loading
                        ? "animate-spin"
                        : ""
                    }
                  />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
              {WEEK_DAYS.map(
                (day) => (
                  <div
                    key={day}
                    className="px-2 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-400"
                  >
                    {day}
                  </div>
                ),
              )}
            </div>

            {loading ? (
              <div className="grid grid-cols-7">
                {Array.from(
                  {
                    length: 42,
                  },
                ).map(
                  (_, index) => (
                    <div
                      key={
                        index
                      }
                      className="h-24 animate-pulse border-b border-r border-slate-100 bg-slate-50/50"
                    />
                  ),
                )}
              </div>
            ) : (
              <div className="grid grid-cols-7">
                {monthDays.map(
                  (date) => {
                    const dateKey =
                      toDateKey(
                        date,
                      );

                    const dayEvents =
                      eventsByDate.get(
                        dateKey,
                      ) ?? [];

                    const inMonth =
                      isSameMonth(
                        date,
                        currentMonth,
                      );

                    const isToday =
                      dateKey ===
                      todayKey;

                    const selected =
                      dateKey ===
                      selectedDate;

                    return (
                      <button
                        key={
                          dateKey
                        }
                        type="button"
                        onClick={() =>
                          setSelectedDate(
                            dateKey,
                          )
                        }
                        className={`min-h-24 border-b border-r border-slate-100 p-2 text-left align-top transition ${
                          selected
                            ? "bg-blue-50/70"
                            : "hover:bg-slate-50"
                        } ${
                          !inMonth
                            ? "bg-slate-50/40 text-slate-300"
                            : ""
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                              isToday
                                ? "bg-blue-600 text-white"
                                : inMonth
                                  ? "text-slate-700"
                                  : "text-slate-300"
                            }`}
                          >
                            {date.getDate()}
                          </span>

                          {dayEvents.length >
                            0 && (
                            <span className="text-[10px] font-semibold text-slate-400">
                              {
                                dayEvents.length
                              }
                            </span>
                          )}
                        </div>

                        <div className="mt-2 space-y-1">
                          {dayEvents
                            .slice(
                              0,
                              2,
                            )
                            .map(
                              (
                                event,
                              ) => {
                                const classes =
                                  eventClasses(
                                    event.type,
                                  );

                                return (
                                  <div
                                    key={
                                      event.id
                                    }
                                    className="flex min-w-0 items-center gap-1.5"
                                  >
                                    <span
                                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${classes.dot}`}
                                    />

                                    <span className="truncate text-[10px] font-medium text-slate-600">
                                      {
                                        event.title
                                      }
                                    </span>
                                  </div>
                                );
                              },
                            )}

                          {dayEvents.length >
                            2 && (
                            <p className="text-[10px] font-semibold text-slate-400">
                              +
                              {dayEvents.length -
                                2}{" "}
                              more
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  },
                )}
              </div>
            )}
          </section>

          {/* SIDE PANEL */}

          <div className="space-y-5">
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 p-4">
                <div className="flex items-center gap-2">
                  <CalendarDays
                    size={18}
                    className="text-blue-600"
                  />

                  <h2 className="font-bold text-slate-800">
                    Selected Date
                  </h2>
                </div>

                <p className="mt-2 text-sm text-slate-500">
                  {formatDateLong(
                    selectedDate,
                  )}
                </p>
              </div>

              <div className="p-4">
                {selectedEvents.length ===
                0 ? (
                  <div className="py-8 text-center">
                    <CalendarDays
                      size={30}
                      className="mx-auto text-slate-300"
                    />

                    <p className="mt-3 text-sm font-semibold text-slate-600">
                      No scheduled events
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      There are no task deadlines or workflow dates on this day.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedEvents.map(
                      (
                        event,
                      ) => {
                        const classes =
                          eventClasses(
                            event.type,
                          );

                        return (
                          <button
                            key={
                              event.id
                            }
                            type="button"
                            onClick={() =>
                              openEvent(
                                event,
                              )
                            }
                            className="w-full rounded-xl border border-slate-200 p-3 text-left transition hover:border-blue-200 hover:bg-slate-50"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <span
                                  className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold ${classes.badge}`}
                                >
                                  {eventTypeLabel(
                                    event.type,
                                  )}
                                </span>

                                <p className="mt-2 truncate text-sm font-bold text-slate-800">
                                  {
                                    event.title
                                  }
                                </p>

                                {event.workflowName && (
                                  <p className="mt-1 truncate text-xs text-slate-400">
                                    {
                                      event.workflowName
                                    }
                                  </p>
                                )}

                                <div className="mt-2 flex flex-wrap gap-2">
                                  <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-500">
                                    {formatLabel(
                                      event.status,
                                    )}
                                  </span>

                                  {event.priority && (
                                    <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-500">
                                      {formatLabel(
                                        event.priority,
                                      )}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <ChevronRight
                                size={
                                  16
                                }
                                className="mt-1 shrink-0 text-slate-300"
                              />
                            </div>
                          </button>
                        );
                      },
                    )}
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 p-4">
                <h2 className="font-bold text-slate-800">
                  Upcoming
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  Next scheduled events
                </p>
              </div>

              <div className="p-4">
                {upcomingEvents.length ===
                0 ? (
                  <p className="py-5 text-center text-sm text-slate-400">
                    No upcoming events.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {upcomingEvents.map(
                      (
                        event,
                      ) => {
                        const classes =
                          eventClasses(
                            event.type,
                          );

                        return (
                          <button
                            key={
                              event.id
                            }
                            type="button"
                            onClick={() => {
                              setSelectedDate(
                                event.date,
                              );

                              const date =
                                parseDateKey(
                                  event.date,
                                );

                              setCurrentMonth(
                                new Date(
                                  date.getFullYear(),
                                  date.getMonth(),
                                  1,
                                ),
                              );
                            }}
                            className="flex w-full items-start gap-3 rounded-xl p-2 text-left transition hover:bg-slate-50"
                          >
                            <span
                              className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${classes.dot}`}
                            />

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-semibold text-slate-700">
                                {
                                  event.title
                                }
                              </p>

                              <p className="mt-1 text-[10px] text-slate-400">
                                {parseDateKey(
                                  event.date,
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          </button>
                        );
                      },
                    )}
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Calendar Key
              </p>

              <div className="mt-3 space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  Task deadline
                </div>

                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Workflow start
                </div>

                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-violet-500" />
                  Workflow end
                </div>

                <div className="flex items-center gap-2">
                  <CheckCircle2
                    size={12}
                    className="text-slate-400"
                  />
                  Data is loaded from your existing workflows and tasks
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}