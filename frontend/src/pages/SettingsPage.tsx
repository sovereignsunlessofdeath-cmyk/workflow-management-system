import {
  Bell,
  Check,
  LayoutDashboard,
  Monitor,
  Moon,
  Radio,
  RotateCcw,
  Save,
  Settings2,
  Sun,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import Header from "../components/layout/Header";

import {
  DEFAULT_SETTINGS,
  useSettings,
  type AppSettings,
  type DensityPreference,
  type LandingPagePreference,
  type ThemePreference,
} from "../context/SettingsContext";

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (
    value: boolean,
  ) => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={
        checked
      }
      onClick={() =>
        onChange(
          !checked,
        )
      }
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${
        checked
          ? "bg-blue-600"
          : "bg-slate-300"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
          checked
            ? "left-[22px]"
            : "left-0.5"
        }`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const {
    settings,
    saveSettings,
    resetSettings,
  } =
    useSettings();

  const [
    draft,
    setDraft,
  ] =
    useState<AppSettings>(
      settings,
    );

  const [
    saved,
    setSaved,
  ] =
    useState(false);

  useEffect(() => {
    setDraft(
      settings,
    );
  }, [settings]);

  function updateSetting<
    Key extends keyof AppSettings,
  >(
    key: Key,
    value:
      AppSettings[Key],
  ) {
    setDraft(
      (current) => ({
        ...current,
        [key]:
          value,
      }),
    );

    setSaved(false);
  }

  function handleSave() {
    saveSettings(
      draft,
    );

    setSaved(true);

    window.setTimeout(
      () => {
        setSaved(false);
      },
      1800,
    );
  }

  function handleReset() {
    resetSettings();

    setDraft(
      DEFAULT_SETTINGS,
    );

    setSaved(true);

    window.setTimeout(
      () => {
        setSaved(false);
      },
      1800,
    );
  }

  return (
    <>
      <Header
        title="Settings"
        subtitle="Manage your application preferences"
      />

      <div className="space-y-5 p-4 md:p-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Settings2
                  size={19}
                  className="text-blue-600"
                />

                <h2 className="font-bold text-slate-800">
                  Application Preferences
                </h2>
              </div>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                These preferences are stored in this browser and are
                applied automatically when you return to the application.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={
                  handleReset
                }
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                <RotateCcw
                  size={16}
                />

                Reset
              </button>

              <button
                type="button"
                onClick={
                  handleSave
                }
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                {saved ? (
                  <Check
                    size={16}
                  />
                ) : (
                  <Save
                    size={16}
                  />
                )}

                {saved
                  ? "Saved"
                  : "Save Changes"}
              </button>
            </div>
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5">
              <div className="flex items-center gap-2">
                <Monitor
                  size={18}
                  className="text-violet-600"
                />

                <h2 className="font-bold text-slate-800">
                  Appearance
                </h2>
              </div>

              <p className="mt-1 text-sm text-slate-400">
                Control the visual theme and layout density.
              </p>
            </div>

            <div className="space-y-6 p-5">
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  Theme
                </p>

                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  {[
                    {
                      value:
                        "system" as ThemePreference,
                      label:
                        "System",
                      icon: (
                        <Monitor
                          size={
                            18
                          }
                        />
                      ),
                    },
                    {
                      value:
                        "light" as ThemePreference,
                      label:
                        "Light",
                      icon: (
                        <Sun
                          size={
                            18
                          }
                        />
                      ),
                    },
                    {
                      value:
                        "dark" as ThemePreference,
                      label:
                        "Dark",
                      icon: (
                        <Moon
                          size={
                            18
                          }
                        />
                      ),
                    },
                  ].map(
                    (
                      option,
                    ) => (
                      <button
                        key={
                          option.value
                        }
                        type="button"
                        onClick={() =>
                          updateSetting(
                            "theme",
                            option.value,
                          )
                        }
                        className={`rounded-xl border p-4 text-left transition ${
                          draft.theme ===
                          option.value
                            ? "border-blue-400 bg-blue-50"
                            : "border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <div className="text-slate-500">
                          {
                            option.icon
                          }
                        </div>

                        <p className="mt-3 text-sm font-semibold text-slate-700">
                          {
                            option.label
                          }
                        </p>
                      </button>
                    ),
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-700">
                  Layout Density
                </p>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {[
                    {
                      value:
                        "comfortable" as DensityPreference,
                      title:
                        "Comfortable",
                      description:
                        "More spacing for a relaxed interface.",
                    },
                    {
                      value:
                        "compact" as DensityPreference,
                      title:
                        "Compact",
                      description:
                        "Fit more information on screen.",
                    },
                  ].map(
                    (
                      option,
                    ) => (
                      <button
                        key={
                          option.value
                        }
                        type="button"
                        onClick={() =>
                          updateSetting(
                            "density",
                            option.value,
                          )
                        }
                        className={`rounded-xl border p-4 text-left transition ${
                          draft.density ===
                          option.value
                            ? "border-blue-400 bg-blue-50"
                            : "border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <p className="text-sm font-semibold text-slate-700">
                          {
                            option.title
                          }
                        </p>

                        <p className="mt-1 text-xs leading-5 text-slate-400">
                          {
                            option.description
                          }
                        </p>
                      </button>
                    ),
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5">
              <div className="flex items-center gap-2">
                <Bell
                  size={18}
                  className="text-emerald-600"
                />

                <h2 className="font-bold text-slate-800">
                  Notifications
                </h2>
              </div>

              <p className="mt-1 text-sm text-slate-400">
                Control realtime updates and notification indicators.
              </p>
            </div>

            <div className="divide-y divide-slate-100">
              <div className="flex items-center justify-between gap-6 p-5">
                <div>
                  <div className="flex items-center gap-2">
                    <Radio
                      size={
                        15
                      }
                      className="text-slate-400"
                    />

                    <p className="text-sm font-semibold text-slate-700">
                      Realtime Notifications
                    </p>
                  </div>

                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    Receive new workflow notifications immediately through
                    the realtime connection.
                  </p>
                </div>

                <Toggle
                  checked={
                    draft.realtimeNotifications
                  }
                  onChange={(
                    value,
                  ) =>
                    updateSetting(
                      "realtimeNotifications",
                      value,
                    )
                  }
                />
              </div>

              <div className="flex items-center justify-between gap-6 p-5">
                <div>
                  <p className="text-sm font-semibold text-slate-700">
                    Notification Badges
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    Display the unread count on the notification bell.
                  </p>
                </div>

                <Toggle
                  checked={
                    draft.showNotificationBadges
                  }
                  onChange={(
                    value,
                  ) =>
                    updateSetting(
                      "showNotificationBadges",
                      value,
                    )
                  }
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5">
              <div className="flex items-center gap-2">
                <LayoutDashboard
                  size={18}
                  className="text-blue-600"
                />

                <h2 className="font-bold text-slate-800">
                  Navigation
                </h2>
              </div>

              <p className="mt-1 text-sm text-slate-400">
                Choose where WMS opens after you sign in.
              </p>
            </div>

            <div className="p-5">
              <label className="text-sm font-semibold text-slate-700">
                Default Landing Page
              </label>

              <select
                value={
                  draft.landingPage
                }
                onChange={(
                  event,
                ) =>
                  updateSetting(
                    "landingPage",
                    event.target
                      .value as LandingPagePreference,
                  )
                }
                className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-400"
              >
                <option value="/dashboard">
                  Dashboard
                </option>

                <option value="/workflows">
                  Workflows
                </option>

                <option value="/tasks">
                  My Tasks
                </option>

                <option value="/calendar">
                  Calendar
                </option>
              </select>

              <p className="mt-2 text-xs leading-5 text-slate-400">
                Your selected page will open automatically after a
                successful login.
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5">
              <h2 className="font-bold text-slate-800">
                Preference Storage
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Information about how these preferences are stored.
              </p>
            </div>

            <div className="space-y-3 p-5">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Storage
                </p>

                <p className="mt-2 text-sm font-semibold text-slate-700">
                  Browser Local Storage
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Scope
                </p>

                <p className="mt-2 text-sm font-semibold text-slate-700">
                  Current browser
                </p>
              </div>

              <p className="text-xs leading-5 text-slate-400">
                These preferences do not modify your backend account
                information.
              </p>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}