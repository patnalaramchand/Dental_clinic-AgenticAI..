// src/pages/PatientAppointments.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarIcon,
  MapPinIcon,
  ClockIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  XCircleIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PatientLayout } from "../layouts/patient/PatientLayout";

type AppointmentRow = {
  id: string | number;
  date: string | null;
  time: string | null;
  doctor: string;
  reason: string;
  status: string; // may be Confirmed/Cancelled/Completed/etc.
  location: string | null;
  notes: string | null;
};

type AppointmentsResponse = {
  items: AppointmentRow[];
  error?: boolean;
};

type LoadState = "loading" | "ready" | "error";

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

function normalizeStatus(s: string) {
  const x = String(s || "").trim().toUpperCase();
  if (x === "CONFIRMED") return "CONFIRMED";
  if (x === "PENDING") return "PENDING";
  if (x === "CANCELLED") return "CANCELLED";
  if (x === "COMPLETED") return "COMPLETED";
  if (x === "OVERDUE") return "OVERDUE";
  return x || "PENDING";
}

export const PatientAppointments: React.FC = () => {
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [status, setStatus] = useState<LoadState>("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setStatus("loading");
        setErrorMsg(null);

        const data = await fetchWithAuth<AppointmentsResponse>(
          "/api/patient/appointments"
        );
        if (cancelled) return;

        setAppointments(data.items ?? []);
        setStatus("ready");
      } catch (err: any) {
        if (cancelled) return;
        console.error("PATIENT APPOINTMENTS ERROR", err);

        if (err.code === "NO_TOKEN" || err.status === 401) {
          setErrorMsg("Session expired. Please log in again.");
          setStatus("error");
          navigate("/login?role=patient");
        } else {
          setErrorMsg(err.message || "Failed to load appointments.");
          setStatus("error");
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const upcomingCount = useMemo(() => {
    return appointments.filter((a) => normalizeStatus(a.status) !== "COMPLETED")
      .length;
  }, [appointments]);

  const getStatusStyles = (st: string) => {
    const s = normalizeStatus(st);
    if (s === "CONFIRMED")
      return "bg-emerald-500/10 text-emerald-200 border border-emerald-500/40";
    if (s === "PENDING")
      return "bg-amber-500/10 text-amber-200 border border-amber-500/40";
    if (s === "CANCELLED")
      return "bg-red-500/10 text-red-200 border border-red-500/40";
    if (s === "COMPLETED")
      return "bg-slate-800 text-slate-200 border border-slate-700";
    return "bg-slate-800 text-slate-200 border border-slate-700";
  };

  const getStatusIcon = (st: string) => {
    const s = normalizeStatus(st);
    if (s === "CONFIRMED")
      return <CheckCircle2Icon size={13} className="mr-1" />;
    if (s === "PENDING")
      return <AlertCircleIcon size={13} className="mr-1" />;
    if (s === "CANCELLED")
      return <XCircleIcon size={13} className="mr-1" />;
    return null;
  };

  return (
    <PatientLayout>
      <section className="flex flex-col gap-2 mb-4">
        <div className="flex items-center gap-2">
          <CalendarIcon size={18} className="text-emerald-300" />
          <h1 className="text-lg font-semibold text-slate-50">Appointments</h1>
        </div>
        <p className="text-xs text-slate-400 max-w-xl">
          View upcoming and past appointments. For urgent changes, please call
          your clinic directly.
        </p>
      </section>

      {errorMsg && (
        <div className="mb-3 rounded-xl border border-amber-500/60 bg-amber-500/10 text-xs text-amber-200 px-3 py-2">
          {errorMsg}
        </div>
      )}

      <section className="bg-slate-950 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] text-slate-400">
            You currently have{" "}
            <span className="text-slate-100 font-medium">
              {status === "ready" ? upcomingCount : "—"} upcoming
            </span>{" "}
            appointment(s).
          </p>
        </div>

        {status === "loading" && (
          <div className="text-xs text-slate-500">Loading appointments…</div>
        )}

        {status === "ready" && appointments.length === 0 && (
          <p className="text-xs text-slate-500">No appointments found.</p>
        )}

        {status === "ready" && appointments.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-separate border-spacing-y-2">
              <thead>
                <tr className="text-[11px] uppercase tracking-[0.14em] text-slate-500">
                  <th className="px-3 py-1.5">Date & time</th>
                  <th className="px-3 py-1.5">Doctor</th>
                  <th className="px-3 py-1.5">Reason</th>
                  <th className="px-3 py-1.5">Location</th>
                  <th className="px-3 py-1.5">Status</th>
                  <th className="px-3 py-1.5 w-[28%]">Notes</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((apt) => (
                  <tr
                    key={apt.id}
                    className="bg-slate-950/40 hover:bg-slate-900/60 transition rounded-xl"
                  >
                    <td className="align-top px-3 py-1.5">
                      <div className="text-slate-50 font-medium">
                        {apt.date || "—"}
                      </div>
                      <div className="flex items-center gap-1 text-slate-400 mt-0.5">
                        <ClockIcon size={11} />
                        <span>{apt.time || "--:--"}</span>
                      </div>
                    </td>
                    <td className="align-top px-3 py-1.5 text-slate-200">
                      {apt.doctor}
                    </td>
                    <td className="align-top px-3 py-1.5 text-slate-300">
                      {apt.reason}
                    </td>
                    <td className="align-top px-3 py-1.5">
                      <div className="flex items-start gap-1.5 text-slate-400">
                        <MapPinIcon size={11} className="mt-0.5" />
                        <span>{apt.location || "Clinic"}</span>
                      </div>
                    </td>
                    <td className="align-top px-3 py-1.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${getStatusStyles(
                          apt.status
                        )}`}
                      >
                        {getStatusIcon(apt.status)}
                        {normalizeStatus(apt.status)}
                      </span>
                    </td>
                    <td className="align-top px-3 py-1.5 text-slate-400">
                      {apt.notes || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </PatientLayout>
  );
};
