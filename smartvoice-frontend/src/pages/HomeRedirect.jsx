import React from "react";
import { Navigate } from "react-router-dom";
import { getRole, isLoggedIn } from "../auth/auth";

export default function HomeRedirect() {
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }

  const role = String(getRole() || "");

  if (role.includes("CUSTOMER")) {
    return <Navigate to="/dashboard" replace />;
  }

  if (role.includes("STAFF")) {
    return <Navigate to="/dashboard" replace />;
  }

  if (role.includes("MANAGER")) {
    return <Navigate to="/dashboard" replace />;
  }

  if (role.includes("ADMIN")) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Navigate to="/login" replace />;
}
