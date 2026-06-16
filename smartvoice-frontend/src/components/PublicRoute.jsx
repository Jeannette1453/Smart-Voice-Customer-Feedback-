import React from "react";
import { Navigate } from "react-router-dom";
import { isLoggedIn } from "../auth/auth";

export default function PublicRoute({ children }) {
  if (isLoggedIn()) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
