import { Navigate } from "react-router-dom";

export default function EntryRoute() {
  const splashSeen =
    sessionStorage.getItem("wms_splash_seen");

  if (splashSeen) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to="/splash" replace />;
}