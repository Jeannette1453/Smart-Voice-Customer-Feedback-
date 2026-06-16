import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { isLoggedIn, getRole } from "./auth";

export default function RoleRoute({ allowedRoles = [], children }) {
  const location = useLocation();

  if (!isLoggedIn()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const role = String(getRole() || "");
  const ok = allowedRoles.some((r) => role.includes(r));

  if (!ok) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

