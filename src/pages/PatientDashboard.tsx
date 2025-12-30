// src/pages/PatientDashboard.tsx
import React, { useEffect, useState } from "react";
import {
  CalendarIcon,
  FileTextIcon,
  CreditCardIcon,
  ChevronRightIcon,
  ClockIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  ShieldIcon,
  SparklesIcon,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { PatientLayout } from "../layouts/patient/PatientLayout";

type Appointment = {
  id: string;
  date: string | null;
  time: string | null;
  doctorName: string;
  reason: string;
  status: string;
  location?: string | null;
};

type TreatmentSummary = {
  id: string;
  title: string;
  lastUpdated: string | null;
  stage: string;
  snippet: string;
};

type Payment = {
  id: string | number;
  date: string | null;
  description: string;
  amount: number;
  currency?: string | null;
  status: string;
};

type DashboardResponse = {
  upcomingAppointments: Appointment[];
  treatmentSummaries: TreatmentSummary[];
  payments: Payment[];
  error?: boolean;
};

type LoadState = "idle" | "loading" | "ready" | "error";

const surfaceCard =
  "rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-950/90 shadow-[0_18px_55px_-40px_rgba(15,23,42,0.35)]";

const statCard =
  "rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-950/80 p-4 flex items-center justify-between shadow-[0_18px_55px_-40px_rgba(15,23,42,0.35)]";

const badgePill =
  "inline-flex items-center gap-1.5 rounded-full border border-slate-200/70 dark:border-slate-800/70 bg-white/80 dark:bg-slate-950/60 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-300";

const SkeletonCard: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div
    className={
      "rounded-xl border border-slate-200/70 dark:border-slate-800/70 bg-slate-50/80 dark:bg-slate-900/60 p-4 animate-pulse " +
      className
    }
  >
    <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded mb-3" />
    <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded mb-2" />
    <div className="h-3 w-2/3 bg-slate-200 dark:bg-slate-800 rounded" />
  </div>
);

// ---- API helper (same style as DoctorDashboard) ----
const API_BASE_URL =
  (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:4000";

async function fetchWithAuth<T>(path: string): Promise<T> {
  const token =
    localStorage.getItem("authToken") || localStorage.getItem("token");

  if (!token) {
    const err: any = new Error("Missing auth token");
    err.code = "NO_TOKEN";
    throw err;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem("authToken");
      localStorage.removeItem("userRole");
      localStorage.removeItem("userName");
      localStorage.removeItem("userId");
    }
    const body = await res.json().catch(() => ({}));
    const err: any = new Error(body.message || `Request failed: ${res.status}`);
    err.status = res.status;
    throw err;
  }

  return res.json() as Promise<T>;
}

export const PatientDashboard: React.FC = () => {
  const userName = localStorage.getItem("userName") || "Patient";
  const navigate = useNavigate();

  const [upcomingAppointments, setUpcomingAppointments] = useState<
    Appointment[]
  >([]);
  const [treatmentSummaries, setTreatmentSummaries] = useState<
    TreatmentSummary[]
  >([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [status, setStatus] = useState<LoadState>("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setStatus("loading");
        setErrorMsg(null);

        const data = await fetchWithAuth<DashboardResponse>(
          "/api/patient/dashboard"
        );
        if (cancelled) return;

        setUpcomingAppointments(data.upcomingAppointments ?? []);
        setTreatmentSummaries(data.treatmentSummaries ?? []);
        setPayments(data.payments ?? []);
        setStatus("ready");
      } catch (err: any) {
        if (cancelled) return;
        console.error("PATIENT DASHBOARD ERROR", err);

        if (err.code === "NO_TOKEN" || err.status === 401) {
          setErrorMsg("Session expired. Please log in again.");
          setStatus("error");
          navigate("/login?role=patient");
        } else {
          setErrorMsg(err.message || "Failed to load dashboard.");
          setStatus("error");
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const pendingCount = payments.filter(
    (p) => p.status?.toUpperCase() !== "PAID"
  ).length;

  const currencyLabel =
    payments.length === 0
      ? "₹"
      : payments[0]?.currency === "INR" || !payments[0]?.currency
      ? "₹"
      : `${payments[0]?.currency} `;

  return (
    <PatientLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* HEADER */}
        <section className="relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-gradient-to-br from-white via-slate-50 to-slate-100 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 px-5 py-5 shadow-[0_26px_80px_-55px_rgba(15,23,42,0.65)]">
          <div className="pointer-events-none absolute -top-16 right-0 h-40 w-40 rounded-full bg-emerald-500/18 dark:bg-emerald-500/14 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-14 left-10 h-32 w-32 rounded-full bg-sky-500/15 dark:bg-sky-500/14 blur-3xl" />

          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-300 tracking-[0.18em] uppercase flex items-center gap-1.5">
                <SparklesIcon size={14} className="text-emerald-400" />
                Patient overview
              </p>
              <h1 className="mt-1 text-xl sm:text-2xl font-semibold text-slate-900 dark:text-slate-50">
                Hi {userName}, welcome back.
              </h1>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 max-w-xl">
                Snapshot of your upcoming visits, active treatments, and recent
                billing activity.
              </p>
            </div>

            <div className={badgePill}>
              <ShieldIcon
                size={14}
                className="text-emerald-500 dark:text-emerald-300"
              />
              <span>Clinic-managed data</span>
            </div>
          </div>
        </section>

        {errorMsg && (
          <div className="rounded-xl border border-amber-500/60 bg-amber-500/10 text-xs text-amber-800 dark:text-amber-200 dark:border-amber-500/80 px-4 py-2">
            {errorMsg}
          </div>
        )}

        {/* STATS ROW */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Appointments stat */}
          <div className={statCard}>
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-500/12 border border-emerald-200 dark:border-emerald-500/40 flex items-center justify-center mr-3">
                <CalendarIcon
                  size={18}
                  className="text-emerald-600 dark:text-emerald-300"
                />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Upcoming visits
                </p>
                <p className="text-xl font-semibold text-slate-900 dark:text-slate-50">
                  {status === "ready" ? upcomingAppointments.length : "—"}
                </p>
              </div>
            </div>
            <Link
              to="/patient/appointments"
              className="text-[11px] text-emerald-600 dark:text-emerald-300 hover:text-emerald-700 dark:hover:text-emerald-200 flex items-center"
            >
              Open schedule
              <ChevronRightIcon size={14} className="ml-1" />
            </Link>
          </div>

          {/* Treatment summaries stat */}
          <div className={statCard}>
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-500/12 border border-sky-200 dark:border-sky-500/40 flex items-center justify-center mr-3">
                <FileTextIcon
                  size={18}
                  className="text-sky-600 dark:text-sky-300"
                />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Active treatments
                </p>
                <p className="text-xl font-semibold text-slate-900 dark:text-slate-50">
                  {status === "ready" ? treatmentSummaries.length : "—"}
                </p>
              </div>
            </div>
            <Link
              to="/patient/treatments"
              className="text-[11px] text-sky-600 dark:text-sky-300 hover:text-sky-700 dark:hover:text-sky-200 flex items-center"
            >
              View details
              <ChevronRightIcon size={14} className="ml-1" />
            </Link>
          </div>

          {/* Pending payments stat */}
          <div className={statCard}>
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-500/12 border border-amber-200 dark:border-amber-500/40 flex items-center justify-center mr-3">
                <CreditCardIcon
                  size={18}
                  className="text-amber-600 dark:text-amber-300"
                />
              </div>
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pending invoices
              </p>
              <p className="text-xl font-semibold text-slate-900 dark:text-slate-50">
                {status === "ready" ? pendingCount : "—"}
              </p>
            </div>
            <Link
              to="/patient/billing"
              className="text-[11px] text-amber-600 dark:text-amber-300 hover:text-amber-700 dark:hover:text-amber-200 flex items-center"
            >
              Open billing
              <ChevronRightIcon size={14} className="ml-1" />
            </Link>
          </div>
        </section>

        {/* MAIN GRID */}
        <section className="grid grid-cols-1 lg:grid-cols-[1.25fr,1fr] gap-6">
          {/* LEFT COLUMN */}
          <div className="space-y-6">
            {/* Upcoming appointments */}
            <div className={surfaceCard}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CalendarIcon
                    size={18}
                    className="text-emerald-600 dark:text-emerald-300"
                  />
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                    Upcoming appointments
                  </h2>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center">
                  <ClockIcon size={12} className="mr-1" />
                  Local time
                </span>
              </div>

              {status === "loading" && (
                <div className="space-y-3">
                  <SkeletonCard />
                  <SkeletonCard />
                </div>
              )}

              {status === "error" && !upcomingAppointments.length && (
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Couldn&apos;t load your schedule. Please refresh later.
                </p>
              )}

              {status === "ready" && (
                <>
                  {upcomingAppointments.length === 0 ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      No upcoming appointments on file.
                    </p>
                  ) : (
                    <ul className="space-y-3 text-xs">
                      {upcomingAppointments.map((apt, index) => (
                        <li
                          key={apt.id}
                          className="relative flex gap-3 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2.5"
                        >
                          {/* timeline bullet */}
                          <div className="flex flex-col items-center pt-1">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                            {index !== upcomingAppointments.length - 1 && (
                              <span className="flex-1 w-px bg-slate-200 dark:bg-slate-800 mt-1" />
                            )}
                          </div>

                          <div className="flex-1">
                            <p className="font-medium text-slate-900 dark:text-slate-50">
                              {apt.date} • {apt.time}
                            </p>
                            <p className="text-slate-600 dark:text-slate-300 mt-0.5">
                              {apt.reason}
                            </p>
                            <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                              With{" "}
                              <span className="text-slate-900 dark:text-slate-100">
                                {apt.doctorName}
                              </span>
                              {apt.location && (
                                <>
                                  {" "}
                                  •{" "}
                                  <span className="text-slate-500 dark:text-slate-400">
                                    {apt.location}
                                  </span>
                                </>
                              )}
                            </p>
                          </div>

                          <div className="flex flex-col items-end gap-1">
                            <span
                              className={
                                "px-2 py-1 rounded-full text-[10px] font-semibold " +
                                (apt.status.toUpperCase() === "CONFIRMED"
                                  ? "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-400/40"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700")
                              }
                            >
                              {apt.status}
                            </span>
                            <Link
                              to="/patient/appointments"
                              className="text-[11px] text-emerald-600 dark:text-emerald-300 hover:text-emerald-700 dark:hover:text-emerald-200"
                            >
                              Open details
                            </Link>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>

            {/* Treatment summaries */}
            <div className={surfaceCard}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileTextIcon
                    size={18}
                    className="text-sky-600 dark:text-sky-300"
                  />
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                    Treatment summaries
                  </h2>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center">
                  <CheckCircle2Icon
                    size={12}
                    className="mr-1 text-emerald-500 dark:text-emerald-300"
                  />
                  AI-assisted notes
                </span>
              </div>

              {status === "loading" && (
                <div className="space-y-3">
                  <SkeletonCard />
                  <SkeletonCard />
                </div>
              )}

              {status === "error" && !treatmentSummaries.length && (
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Couldn&apos;t load treatment history.
                </p>
              )}

              {status === "ready" && (
                <>
                  {treatmentSummaries.length === 0 ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      No treatment summaries available yet.
                    </p>
                  ) : (
                    <ul className="space-y-3 text-xs">
                      {treatmentSummaries.map((t) => (
                        <li
                          key={t.id}
                          className="bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-3"
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <p className="font-medium text-slate-900 dark:text-slate-50">
                              {t.title}
                            </p>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">
                              Updated: {t.lastUpdated}
                            </span>
                          </div>
                          <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mb-1">
                            Stage: {t.stage}
                          </p>
                          <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                            {t.snippet}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6">
            {/* Payments */}
            <div className={surfaceCard}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CreditCardIcon
                    size={18}
                    className="text-amber-600 dark:text-amber-300"
                  />
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                    Payments & invoices
                  </h2>
                </div>
                <Link
                  to="/patient/billing"
                  className="text-[11px] text-amber-600 dark:text-amber-300 hover:text-amber-700 dark:hover:text-amber-200 flex items-center"
                >
                  Open billing
                  <ChevronRightIcon size={14} className="ml-1" />
                </Link>
              </div>

              {status === "loading" && (
                <div className="space-y-3">
                  <SkeletonCard />
                  <SkeletonCard />
                </div>
              )}

              {status === "error" && !payments.length && (
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Couldn&apos;t load billing details.
                </p>
              )}

              {status === "ready" && (
                <>
                  {payments.length === 0 ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      No invoices yet.
                    </p>
                  ) : (
                    <ul className="space-y-3 text-xs">
                      {payments.map((p) => (
                        <li
                          key={p.id}
                          className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2.5"
                        >
                          <div>
                            <p className="font-medium text-slate-900 dark:text-slate-50">
                              {p.description}
                            </p>
                            <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                              {p.date} • {p.id}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-amber-700 dark:text-amber-200">
                              {currencyLabel}
                              {Number(p.amount || 0).toLocaleString("en-IN")}
                            </p>
                            <span
                              className={
                                "inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold " +
                                (p.status.toUpperCase() === "PAID"
                                  ? "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-400/40"
                                  : "bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-200 border border-amber-200 dark:border-amber-400/40")
                              }
                            >
                              {p.status.toUpperCase() === "PAID" ? (
                                <CheckCircle2Icon size={11} className="mr-1" />
                              ) : (
                                <AlertCircleIcon size={11} className="mr-1" />
                              )}
                              {p.status}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>

            {/* Note card */}
            <div className={surfaceCard + " p-4 flex items-start gap-3 text-[11px]"}>
              <ShieldIcon
                size={16}
                className="text-emerald-600 dark:text-emerald-300 mt-0.5"
              />
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-50 mb-1">
                  Data from your clinic
                </p>
                <p className="text-slate-600 dark:text-slate-300">
                  Appointment, treatment, and billing data refresh automatically
                  from the clinic’s system.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PatientLayout>
  );
};
