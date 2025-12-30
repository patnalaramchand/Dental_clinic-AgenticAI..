// src/AppRouter.tsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { Landing } from "./pages/Landing";
import { Login } from "./pages/auth/Login";
import { ForgotPassword } from "./pages/auth/ForgotPassword";
import { CreateAccount } from "./pages/auth/CreateAccount";
import { ResetPassword } from "./pages/auth/ResetPassword";

// Dashboards
import { AdminDashboard } from "./pages/AdminDashboard";
import { DoctorDashboard } from "./pages/DoctorDashboard";
import { PatientDashboard } from "./pages/PatientDashboard";
import { DoctorLayout } from "./layouts/doctor/DoctorLayout";
import { PatientLayout } from "./layouts/patient/PatientLayout";
// Layouts
import { AdminLayout } from "./layouts/admin/AdminLayout";
import { MainLayout } from "./layouts/MainLayout";
import { SettingsLayout } from "./layouts/SettingsLayout";
import AdminClinicSetup from "./layouts/admin/AdminClinicSetup";

// Appointments
import { AppointmentList } from "./pages/appointments/AppointmentList";
import { AppointmentDetails } from "./pages/appointments/AppointmentDetails";
import { AppointmentsCalendar } from "./pages/appointments/AppointmentsCalendar";

// Settings
import { UserSettings } from "./pages/settings/UserSettings";
import { ClinicSettings } from "./pages/settings/ClinicSettings";
import { AgentSettings } from "./pages/settings/AgentSettings";
import { ThemeSettings } from "./pages/settings/ThemeSettings";

// Patient pages
import { PatientAppointments } from "./pages/PatientAppointments";
import { PatientTreatments } from "./pages/PatientTreatments";
import { PatientBilling } from "./pages/PatientBilling";

// Doctor pages
import { DoctorAppointments } from "./layouts/doctor/DoctorAppointments";
import { DoctorCases } from "./layouts/doctor/DoctorCases";
import { DoctorPatients } from "./layouts/doctor/DoctorPatients";
import { DoctorInsights } from "./layouts/doctor/DoctorInsights";
import { DoctorHelp } from "./layouts/doctor/DoctorHelp";

// ✅ NEW Notifications pages
import {  AdminNotificationsPage } from "./layouts/admin/NotificationsPage";
import { DoctorNotificationsPage } from "./layouts/doctor/DoctorNotificationsPage";

import {  PatientNotificationsPage } from "./layouts/patient/NotificationsPage";

// Admin pages
import { AdminAppointments } from "./layouts/admin/AdminAppointments";
import { AdminCases } from "./layouts/admin/AdminCases";
import { AdminPatients } from "./layouts/admin/AdminPatients";
import { AdminInventory } from "./layouts/admin/AdminInventory";
import { AdminRevenue } from "./layouts/admin/AdminRevenue";
import { AdminHelp } from "./layouts/admin/AdminHelp";
import { AdminCaseTracking } from "./layouts/admin/AdminCaseTracking";

// Patient help
import { PatientHelp } from "./layouts/patient/PatientHelp";

// Global help
import { HelpAndContact } from "./pages/HelpAndContact";
import { ContactSupport } from "./pages/help/ContactSupport";

import { ProtectedRoute } from "./components/ProtectedRoute";

const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-soft">
    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
      {title}
    </h1>
    <p className="text-gray-600 dark:text-gray-300">
      This page is under construction. Check back soon!
    </p>
  </div>
);

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ---------- Public ---------- */}
        <Route path="/" element={<Landing />} />
        <Route path="/landing" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/create-account" element={<CreateAccount />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* ---------- ADMIN (FIXED, NO ROUTE CHANGES) ---------- */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/clinic-setup"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <AdminClinicSetup />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/appointments"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <AdminAppointments />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/cases"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <AdminCases />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/case-tracking"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <AdminCaseTracking />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/patients"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <AdminPatients />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/inventory"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <AdminInventory />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        {/* ✅ NEW: Admin Notifications */}
        <Route
          path="/admin/notifications"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <AdminNotificationsPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/revenue"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <AdminRevenue />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/help"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <AdminHelp />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        {/* Old redirect */}
        <Route
          path="/app/AdminDashboard"
          element={<Navigate to="/admin/dashboard" replace />}
        />

        {/* ---------- DOCTOR (UNCHANGED + NEW NOTIFICATIONS) ---------- */}
        <Route
          path="/app/DoctorDashboard"
          element={
            <ProtectedRoute>
              <DoctorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor/appointments"
          element={
            <ProtectedRoute>
              <DoctorAppointments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor/cases"
          element={
            <ProtectedRoute>
              <DoctorCases />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor/patients"
          element={
            <ProtectedRoute>
              <DoctorPatients />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor/insights"
          element={
            <ProtectedRoute>
              <DoctorInsights />
            </ProtectedRoute>
          }
        />

       <Route
  path="/doctor/notifications"
  element={
    <ProtectedRoute>
      <DoctorLayout>
        <DoctorNotificationsPage />
      </DoctorLayout>
    </ProtectedRoute>
  }
/>


        <Route
          path="/doctor/help"
          element={
            <ProtectedRoute>
              <DoctorHelp />
            </ProtectedRoute>
          }
        />

        {/* ---------- PATIENT (UNCHANGED + NEW NOTIFICATIONS) ---------- */}
        <Route
          path="/app/PatientDashboard"
          element={
            <ProtectedRoute>
              <PatientDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/appointments"
          element={
            <ProtectedRoute>
              <PatientAppointments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/treatments"
          element={
            <ProtectedRoute>
              <PatientTreatments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/billing"
          element={
            <ProtectedRoute>
              <PatientBilling />
            </ProtectedRoute>
          }
        />

        {/* ✅ NEW: Patient Notifications */}
        <Route
          path="/patient/notifications"
          element={
              <PatientLayout>
            <ProtectedRoute>
              <PatientNotificationsPage />
            </ProtectedRoute>
            </PatientLayout>
          }
        />

        <Route
          path="/patient/help"
          element={
            <ProtectedRoute>
              <PatientHelp />
            </ProtectedRoute>
          }
        />

        {/* ---------- GLOBAL HELP ---------- */}
        <Route
          path="/help"
          element={
            <ProtectedRoute>
              <HelpAndContact />
            </ProtectedRoute>
          }
        />
        <Route
          path="/help/contact"
          element={
            <ProtectedRoute>
              <ContactSupport />
            </ProtectedRoute>
          }
        />

        {/* ---------- /app LEGACY SHELL (UNCHANGED) ---------- */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="appointments" element={<AppointmentList />} />
          <Route path="appointments/today" element={<AppointmentsCalendar />} />
          <Route path="appointments/:id" element={<AppointmentDetails />} />

          <Route path="settings" element={<SettingsLayout />}>
            <Route index element={<Navigate to="user" replace />} />
            <Route path="user" element={<UserSettings />} />
            <Route path="clinic" element={<ClinicSettings />} />
            <Route path="agent" element={<AgentSettings />} />
            <Route path="theme" element={<ThemeSettings />} />
          </Route>

          <Route
            path="inventory"
            element={<PlaceholderPage title="Inventory (legacy view)" />}
          />
          <Route
            path="inventory/table"
            element={<PlaceholderPage title="Inventory Table (legacy view)" />}
          />
          <Route
            path="revenue"
            element={<PlaceholderPage title="Revenue (legacy view)" />}
          />
          <Route path="cases" element={<PlaceholderPage title="Cases (legacy view)" />} />
          <Route path="cases/:id" element={<PlaceholderPage title="Case Details (legacy view)" />} />
          <Route path="patients" element={<PlaceholderPage title="Patients (legacy view)" />} />
          <Route path="patients/:id" element={<PlaceholderPage title="Patient Profile (legacy view)" />} />

          <Route path="help" element={<Navigate to="/admin/help" replace />} />
          <Route path="help/contact" element={<Navigate to="/admin/help" replace />} />
          <Route path="help/documentation" element={<Navigate to="/admin/help" replace />} />
          <Route path="help/videos" element={<Navigate to="/admin/help" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
