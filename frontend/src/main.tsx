import {
  createRoot,
} from "react-dom/client";

import {
  BrowserRouter,
} from "react-router-dom";

import "./index.css";

import App from "./App";

import {
  SettingsProvider,
} from "./context/SettingsContext";

import {
  AuthProvider,
} from "./context/AuthContext";

import {
  NotificationProvider,
} from "./context/NotificationContext";

createRoot(
  document.getElementById(
    "root",
  )!,
).render(
  <BrowserRouter>
    <SettingsProvider>
      <AuthProvider>
        <NotificationProvider>
          <App />
        </NotificationProvider>
      </AuthProvider>
    </SettingsProvider>
  </BrowserRouter>,
);