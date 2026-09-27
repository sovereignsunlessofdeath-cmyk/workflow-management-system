import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ThemePreference =
  | "system"
  | "light"
  | "dark";

export type DensityPreference =
  | "comfortable"
  | "compact";

export type LandingPagePreference =
  | "/dashboard"
  | "/workflows"
  | "/tasks"
  | "/calendar";

export type AppSettings = {
  theme: ThemePreference;
  density: DensityPreference;
  realtimeNotifications: boolean;
  showNotificationBadges: boolean;
  landingPage: LandingPagePreference;
};

type SettingsContextValue = {
  settings: AppSettings;
  saveSettings: (
    nextSettings: AppSettings,
  ) => void;
  resetSettings: () => void;
};

const STORAGE_KEY =
  "wms-ui-settings";

export const DEFAULT_SETTINGS: AppSettings = {
  theme: "system",
  density: "comfortable",
  realtimeNotifications: true,
  showNotificationBadges: true,
  landingPage: "/dashboard",
};

const SettingsContext =
  createContext<
    SettingsContextValue | undefined
  >(undefined);

function isThemePreference(
  value: unknown,
): value is ThemePreference {
  return (
    value === "system" ||
    value === "light" ||
    value === "dark"
  );
}

function isDensityPreference(
  value: unknown,
): value is DensityPreference {
  return (
    value === "comfortable" ||
    value === "compact"
  );
}

function isLandingPagePreference(
  value: unknown,
): value is LandingPagePreference {
  return (
    value === "/dashboard" ||
    value === "/workflows" ||
    value === "/tasks" ||
    value === "/calendar"
  );
}

function normalizeSettings(
  value: Partial<AppSettings> | null,
): AppSettings {
  if (!value) {
    return DEFAULT_SETTINGS;
  }

  return {
    theme: isThemePreference(
      value.theme,
    )
      ? value.theme
      : DEFAULT_SETTINGS.theme,

    density: isDensityPreference(
      value.density,
    )
      ? value.density
      : DEFAULT_SETTINGS.density,

    realtimeNotifications:
      typeof value.realtimeNotifications ===
      "boolean"
        ? value.realtimeNotifications
        : DEFAULT_SETTINGS.realtimeNotifications,

    showNotificationBadges:
      typeof value.showNotificationBadges ===
      "boolean"
        ? value.showNotificationBadges
        : DEFAULT_SETTINGS.showNotificationBadges,

    landingPage:
      isLandingPagePreference(
        value.landingPage,
      )
        ? value.landingPage
        : DEFAULT_SETTINGS.landingPage,
  };
}

function loadSettings(): AppSettings {
  try {
    const stored =
      localStorage.getItem(
        STORAGE_KEY,
      );

    if (!stored) {
      return DEFAULT_SETTINGS;
    }

    return normalizeSettings(
      JSON.parse(stored),
    );
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function SettingsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [
    settings,
    setSettings,
  ] =
    useState<AppSettings>(
      loadSettings,
    );

  useEffect(() => {
    const root =
      document.documentElement;

    root.dataset.density =
      settings.density;

    root.dataset.themePreference =
      settings.theme;

    const mediaQuery =
      window.matchMedia(
        "(prefers-color-scheme: dark)",
      );

    function applyTheme() {
      const resolvedTheme =
        settings.theme ===
        "system"
          ? mediaQuery.matches
            ? "dark"
            : "light"
          : settings.theme;

      root.dataset.theme =
        resolvedTheme;

      root.style.colorScheme =
        resolvedTheme;
    }

    applyTheme();

    if (
      settings.theme !== "system"
    ) {
      return;
    }

    mediaQuery.addEventListener(
      "change",
      applyTheme,
    );

    return () => {
      mediaQuery.removeEventListener(
        "change",
        applyTheme,
      );
    };
  }, [
    settings.theme,
    settings.density,
  ]);

  function saveSettings(
    nextSettings: AppSettings,
  ) {
    const normalized =
      normalizeSettings(
        nextSettings,
      );

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        normalized,
      ),
    );

    setSettings(
      normalized,
    );
  }

  function resetSettings() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        DEFAULT_SETTINGS,
      ),
    );

    setSettings(
      DEFAULT_SETTINGS,
    );
  }

  const value =
    useMemo(
      () => ({
        settings,
        saveSettings,
        resetSettings,
      }),
      [settings],
    );

  return (
    <SettingsContext.Provider
      value={value}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context =
    useContext(
      SettingsContext,
    );

  if (!context) {
    throw new Error(
      "useSettings must be used inside SettingsProvider.",
    );
  }

  return context;
}