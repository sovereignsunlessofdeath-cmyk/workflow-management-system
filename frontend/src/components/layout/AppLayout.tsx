import {
  useState,
} from "react";

import {
  Outlet,
} from "react-router-dom";

import Sidebar from "./Sidebar";


export default function AppLayout() {
  const [
    sidebarCollapsed,
    setSidebarCollapsed,
  ] =
    useState(false);


  return (
    <div className="wms-app-shell min-h-screen overflow-x-hidden">
      <Sidebar
        collapsed={
          sidebarCollapsed
        }
        onToggle={() =>
          setSidebarCollapsed(
            (
              current,
            ) =>
              !current,
          )
        }
      />


      <main
        className={`relative z-10 min-h-screen transition-[margin] duration-300 ease-out ${
          sidebarCollapsed
            ? "lg:ml-20"
            : "lg:ml-60"
        }`}
      >
        <div className="min-h-screen">
          <Outlet />
        </div>
      </main>
    </div>
  );
}