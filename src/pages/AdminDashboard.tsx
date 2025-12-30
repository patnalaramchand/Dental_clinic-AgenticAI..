// src/pages/AdminDashboard.tsx
import React, { useEffect, useState } from "react";
import {
  CalendarDays,
  Package,
  LineChart,
  ClipboardList,
  Users,
  Activity,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
const ADMIN_API = `${API_BASE}/api/admin`;

function getAuthHeaders() {
  const token = localStorage.getItem("authToken");
  return token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" };
}

type DashboardSummary = {
  todayAppointments: number;
  todayAppointmentsDelta: number;
  lowStockItems: number;
  todaysRevenue: number;
  todaysRevenueDeltaPercent: number | null;
  activeCases: number;
  casePipeline: {
    new: number;
    inTreatment: number;
    awaitingFollowUp: number;
  };
  patientSnapshot: {
    newPatientsToday: number;
    returningPatientsToday: number;
    cancelledAppointmentsToday: number;
  };
  asOf: string;
};

export const AdminDashboard: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const userName = localStorage.getItem("userName") || "Admin";
  const clinicName = "Dental Clinic Intelligence";

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`${ADMIN_API}/dashboard-summary`, {
          headers: getAuthHeaders(),
        });

        if (!res.ok) {
          throw new Error(`Status ${res.status}`);
        }

        const data = await res.json();
        setSummary(data);
      } catch (err) {
        console.error("Dashboard summary error:", err);
        setError("Failed to load dashboard summary.");
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50">
      <main className="px-4 lg:px-6 py-5 space-y-6">
        {/* Header */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 shadow-sm shadow-slate-200/50 dark:shadow-none">
          <div>
            <p className="text-xs font-medium text-emerald-500 tracking-[0.16em] uppercase">
              Executive overview
            </p>
            <h1 className="mt-1 text-xl font-semibold">
              Good to see you, {userName}.
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              You&apos;re viewing the live snapshot of{" "}
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {clinicName}
              </span>{" "}
              across appointments, inventory, revenue and active cases.
            </p>
            {summary && (
              <p className="mt-1 text-xs text-slate-400">
                As of: <span className="font-mono">{summary.asOf}</span>
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
              <Activity size={13} />
              {loading ? "Loading dashboards..." : "Realtime dashboards on"}
            </span>
            {error && (
              <span className="text-[11px] text-rose-400">{error}</span>
            )}
          </div>
        </section>

        {/* KPI Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Appointments */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Today&apos;s appointments
              </span>
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <CalendarDays size={16} className="text-emerald-500" />
              </div>
            </div>
            <p className="text-2xl font-semibold">
              {summary ? summary.todayAppointments : "--"}
            </p>
            <p className="text-xs text-emerald-500">
              {summary
                ? `+${summary.todayAppointmentsDelta} vs last week`
                : "Loading..."}
            </p>
          </div>

          {/* Low stock */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Low-stock items</span>
              <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Package size={16} className="text-amber-500" />
              </div>
            </div>
            <p className="text-2xl font-semibold">
              {summary ? summary.lowStockItems : "--"}
            </p>
            <p className="text-xs text-amber-500">
              Inventory agent watching
            </p>
          </div>

          {/* Revenue */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Today&apos;s revenue
              </span>
              <div className="w-8 h-8 rounded-full bg-sky-500/10 flex items-center justify-center">
                <LineChart size={16} className="text-sky-500" />
              </div>
            </div>
            <p className="text-2xl font-semibold">
              {summary
                ? `₹${summary.todaysRevenue.toLocaleString()}`
                : "--"}
            </p>
            <p className="text-xs text-sky-500">
              {summary && summary.todaysRevenueDeltaPercent != null
                ? `${summary.todaysRevenueDeltaPercent.toFixed(
                    1
                  )}% vs rolling 7-day avg`
                : "Loading..."}
            </p>
          </div>

          {/* Active cases */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Active cases</span>
              <div className="w-8 h-8 rounded-full bg-violet-500/10 flex items-center justify-center">
                <ClipboardList size={16} className="text-violet-500" />
              </div>
            </div>
            <p className="text-2xl font-semibold">
              {summary ? summary.activeCases : "--"}
            </p>
            <p className="text-xs text-violet-500">
              Case agent tracking progress
            </p>
          </div>
        </section>

        {/* Second row */}
        <section className="grid grid-cols-1 lg:grid-cols-[1.4fr,1fr] gap-4">
          {/* Case pipeline */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ClipboardList size={16} className="text-violet-500" />
                <h2 className="text-sm font-semibold">Case pipeline</h2>
              </div>
              <span className="text-[11px] text-slate-500">
                From case tracking agent
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs">
              {summary ? (
                <>
                  {Object.entries(summary.casePipeline).map(
                    ([key, value]) => (
                      <div
                        key={key}
                        className="bg-slate-50 dark:bg-slate-950/60 rounded-xl p-3 border border-slate-200 dark:border-slate-800"
                      >
                        <p className="text-slate-500 capitalize">
                          {key.replace(/([A-Z])/g, " $1")}
                        </p>
                        <p className="mt-1 text-xl font-semibold">{value}</p>
                      </div>
                    )
                  )}
                </>
              ) : (
                <p className="text-slate-400">Loading...</p>
              )}
            </div>
          </div>

          {/* Patients snapshot */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-emerald-500" />
                <h2 className="text-sm font-semibold">
                  Patients (snapshot)
                </h2>
              </div>
              <span className="text-[11px] text-slate-500">Today</span>
            </div>

            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <li className="flex justify-between">
                <span>New patients registered</span>
                <span className="font-semibold text-slate-900 dark:text-slate-50">
                  {summary
                    ? summary.patientSnapshot.newPatientsToday
                    : "--"}
                </span>
              </li>
              <li className="flex justify-between">
                <span>Returning patients</span>
                <span className="font-semibold text-slate-900 dark:text-slate-50">
                  {summary
                    ? summary.patientSnapshot.returningPatientsToday
                    : "--"}
                </span>
              </li>
              <li className="flex justify-between">
                <span>Cancelled appointments</span>
                <span className="font-semibold text-amber-500">
                  {summary
                    ? summary.patientSnapshot.cancelledAppointmentsToday
                    : "--"}
                </span>
              </li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
};
