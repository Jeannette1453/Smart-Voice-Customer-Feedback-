// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import FeedbackMy from "./pages/FeedbackMy";
import FeedbackAll from "./pages/FeedbackAll";
import Reports from "./pages/Reports";
import Unauthorized from "./pages/Unauthorized";
import Landing from "./pages/Landing";
import FeedbackNew from "./pages/FeedbackNew";
import Notifications from "./pages/Notifications";
import Surveys from "./pages/Surveys";
import Users from "./pages/Users";
import Profile from "./pages/Profile";
import TakeSurvey from "./pages/TakeSurvey";
import SurveyResults from "./pages/SurveyResults";
import FeedbackDetails from "./pages/FeedbackDetails";
import Faqs from "./pages/Faqs";
import FaqAdmin from "./pages/FaqAdmin";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AssignedFeedback from "./pages/AssignedFeedback";
import AdminSettings from "./pages/AdminSettings";
import Customers from "./pages/Customers";

import Layout from "./components/Layout";
import RequireAuth from "./auth/RequireAuth";
import RoleRoute from "./auth/RoleRoute";

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Home decides based on role */}
        <Route path="/" element={<Landing />} />

        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <Layout>
                <Dashboard />
              </Layout>
            </RequireAuth>
          }
        />

        <Route
  path="/feedback/:id"
  element={
    <RequireAuth>
      <RoleRoute allowedRoles={["CUSTOMER", "STAFF", "MANAGER", "ADMIN"]}>
        <Layout>
          <FeedbackDetails />
        </Layout>
      </RoleRoute>
    </RequireAuth>
  }
/>
<Route
  path="/feedback/assigned"
  element={
    <RequireAuth>
      <RoleRoute allowedRoles={["STAFF", "MANAGER"]}>
        <Layout>
          <AssignedFeedback />
        </Layout>
      </RoleRoute>
    </RequireAuth>
  }
/>

<Route
  path="/admin/settings"
  element={
    <RequireAuth>
      <RoleRoute allowedRoles={["ADMIN"]}>
        <Layout>
          <AdminSettings />
        </Layout>
      </RoleRoute>
    </RequireAuth>
  }
/>

<Route
  path="/feedback"
  element={
    <RequireAuth>
      <RoleRoute allowedRoles={["MANAGER", "ADMIN"]}>
        <Layout>
          <FeedbackAll />
        </Layout>
      </RoleRoute>
    </RequireAuth>
  }
/>

        <Route
          path="/profile"
          element={
            <RequireAuth>
              <Layout>
                <Profile />
              </Layout>
            </RequireAuth>
          }
        />

               <Route
  path="/faqs"
  element={
    <RequireAuth>
      <Layout>
        <Faqs />
      </Layout>
    </RequireAuth>
  }
/>

<Route
  path="/admin/faqs"
  element={
    <RequireAuth>
      <RoleRoute allowedRoles={["ADMIN", "MANAGER"]}>
        <Layout>
          <FaqAdmin />
        </Layout>
      </RoleRoute>
    </RequireAuth>
  }
/>

        <Route
          path="/notifications"
          element={
            <RequireAuth>
              <Layout>
                <Notifications />
              </Layout>
            </RequireAuth>
          }
        />

        {/* ADMIN only */}
        <Route
          path="/users"
          element={
            <RequireAuth>
              <RoleRoute allowedRoles={["ADMIN"]}>
                <Layout>
                  <Users />
                </Layout>
              </RoleRoute>
            </RequireAuth>
          }
        />

        {/* MANAGER/ADMIN: Customers outreach */}
        <Route
          path="/customers"
          element={
            <RequireAuth>
              <RoleRoute allowedRoles={["MANAGER","ADMIN"]}>
                <Layout>
                  <Customers />
                </Layout>
              </RoleRoute>
            </RequireAuth>
          }
        />

        {/* ✅ Surveys page:
            CUSTOMER: view active surveys
            STAFF: (optional) view active surveys if you want them to help customers
            MANAGER/ADMIN: manage + create surveys
        */}
        <Route
          path="/surveys"
          element={
            <RequireAuth>
              <RoleRoute allowedRoles={["CUSTOMER", "STAFF", "MANAGER", "ADMIN"]}>
                <Layout>
                  <Surveys />
                </Layout>
              </RoleRoute>
            </RequireAuth>
          }
        />

        {/* TAKE SURVEY:
            - CUSTOMER can take
            - STAFF (optional) can preview/take if you want
            - MANAGER/ADMIN can preview
        */}
        <Route
          path="/surveys/:id/take"
          element={
            <RequireAuth>
              <RoleRoute allowedRoles={["CUSTOMER", "STAFF", "MANAGER", "ADMIN"]}>
                <Layout>
                  <TakeSurvey />
                </Layout>
              </RoleRoute>
            </RequireAuth>
          }
        />

        {/* RESULTS: MANAGER/ADMIN only */}
        <Route
          path="/surveys/:id/results"
          element={
            <RequireAuth>
              <RoleRoute allowedRoles={["MANAGER", "ADMIN"]}>
                <Layout>
                  <SurveyResults />
                </Layout>
              </RoleRoute>
            </RequireAuth>
          }
        />

        {/* CUSTOMER */}
        <Route
          path="/feedback/me"
          element={
            <RequireAuth>
              <RoleRoute allowedRoles={["CUSTOMER"]}>
                <Layout>
                  <FeedbackMy />
                </Layout>
              </RoleRoute>
            </RequireAuth>
          }
        />

        <Route
          path="/feedback/new"
          element={
            <RequireAuth>
              <RoleRoute allowedRoles={["CUSTOMER"]}>
                <Layout>
                  <FeedbackNew />
                </Layout>
              </RoleRoute>
            </RequireAuth>
          }
        />

        {/* STAFF/MANAGER/ADMIN */}
        <Route
          path="/feedback"
          element={
            <RequireAuth>
              <RoleRoute allowedRoles={["STAFF", "MANAGER", "ADMIN"]}>
                <Layout>
                  <FeedbackAll />
                </Layout>
              </RoleRoute>
            </RequireAuth>
          }
        />

        <Route
          path="/reports"
          element={
            <RequireAuth>
              <RoleRoute allowedRoles={["MANAGER", "ADMIN"]}>
                <Layout>
                  <Reports />
                </Layout>
              </RoleRoute>
            </RequireAuth>
          }
        />

        {/* Catch-all */}
        <Route
          path="*"
          element={
            <RequireAuth>
              <Navigate to="/dashboard" replace />
            </RequireAuth>
          }
        />
      </Routes>
    </Router>
  );
}
