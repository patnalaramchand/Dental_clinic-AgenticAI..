import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarDaysIcon,
  ClockIcon,
  AlertCircleIcon,
  CheckCircle2Icon,
  RefreshCwIcon,
} from "lucide-react";
import { DoctorLayout } from "../../layouts/doctor/DoctorLayout";

type DoctorAppointment = {
  dbId: number; // ✅ DB id used for complete endpoint
  id: string; // appointment_uid for display
  date: string | null;
  time: string | null;
  patient: string;
  reason: string;
  room: string;
  status: string; // Confirmed | In progress | Completed | Cancelled | Checked in etc.
};

const API_BASE_URL =
  (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:4000";

const getAuthToken = () =>
  localStorage.getItem("authToken") || localStorage.getItem("token") || "";

// Normalize status safely
const norm = (s: any) => String(s || "").trim().toUpperCase();

function mapStatusToUiLabel(raw: any) {
  const s = norm(raw);
  if (s === "CONFIRMED") return "Confirmed";
  if (s === "CHECKED IN") return "In progress";
  if (s === "IN PROGRESS") return "In progress";
  if (s === "COMPLETED") return "Completed";
  if (s === "CANCELLED") return "Cancelled";
  if (s === "PENDING") return "Pending";
  if (!s) return "Pending";
  // fallback: show original (nice-ish)
  return String(raw);
}

function canCompleteStatus(raw: any) {
  const s = norm(raw);

  // final states => no button
  if (!s) return false;
  if (s === "COMPLETED" || s === "CANCELLED") return false;

  // active states => allow
  return (
    s === "CONFIRMED" ||
    s === "CHECKED IN" ||
    s === "IN PROGRESS" ||
    s === "PENDING" ||
    s === "SCHEDULED"
  );
}

function statusPillClass(raw: any) {
  const s = norm(raw);

  if (s === "CONFIRMED")
    return "bg-emerald-500/10 text-emerald-200 border-emerald-400/50";
  if (s === "CHECKED IN" || s === "IN PROGRESS")
    return "bg-sky-500/10 text-sky-200 border-sky-400/50";
  if (s === "COMPLETED")
    return "bg-slate-700 text-slate-100 border-slate-500";
  if (s === "CANCELLED") return "bg-red-500/10 text-red-200 border-red-400/40";
  if (s === "PENDING")
    return "bg-amber-500/10 text-amber-200 border-amber-400/40";

  return "bg-slate-800 text-slate-200 border-slate-700";
}

export const DoctorAppointments: React.FC = () => {
  const [appointments, setAppointments] = useState<DoctorAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<number | null>(null);

  const totalCount = appointments.length;

  const actionableCount = useMemo(() => {
    return appointments.filter((a) => canCompleteStatus(a.status)).length;
  }, [appointments]);

  async function fetchAppointments() {
    const token = getAuthToken();
    if (!token) {
      setError("Not authenticated. Please login again.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`${API_BASE_URL}/api/doctor/appointments`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.message || "Failed to load appointments");
      }

      // ✅ Ensure we always have dbId, and normalize UI fields
      const items: DoctorAppointment[] = (body.items || []).map((x: any) => ({
        dbId: Number(x.dbId ?? x.id), // fallback: if backend sends dbId as id
        id: String(x.id ?? x.appointment_uid ?? x.appointmentUid ?? x.dbId ?? ""),
        date: x.date ?? null,
        time: x.time ?? null,
        patient: x.patient ?? "—",
        reason: x.reason ?? x.type ?? "General visit",
        room: x.room ?? "—",
        status: mapStatusToUiLabel(x.status),
      }));

      setAppointments(items);
    } catch (err: any) {
      console.error("Doctor appointments error:", err);
      setError(err.message || "Unable to load appointments");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function markCompleted(dbId: number) {
    const token = getAuthToken();
    if (!token) {
      setError("Not authenticated. Please login again.");
      return;
    }

    try {
      setCompletingId(dbId);

      // ✅ DOCTOR endpoint (not admin)
      const res = await fetch(
        `${API_BASE_URL}/api/doctor/appointments/${dbId}/complete`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.message || "Failed to mark completed");
      }

      // ✅ instant UI update
      setAppointments((prev) =>
        prev.map((a) =>
          a.dbId === dbId ? { ...a, status: "Completed" } : a
        )
      );
    } catch (e: any) {
      console.error("Complete appointment error:", e);
      setError(e?.message || "Could not complete appointment");
    } finally {
      setCompletingId(null);
    }
  }

  return (
    <DoctorLayout>
      {/* Header */}
      <section className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <CalendarDaysIcon size={18} className="text-emerald-300" />
          <h1 className="text-lg font-semibold text-slate-50">
            Today&apos;s schedule
          </h1>
        </div>
        <p className="text-sm text-slate-400">
          View your appointments for today. Mark visits completed after the
          patient is done.
        </p>
      </section>

      {/* Card */}
      <section className="rounded-2xl border border-slate-800 bg-slate-950/90 backdrop-blur px-4 py-4">
        <div className="flex items-center justify-between mb-3 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <ClockIcon size={13} />
            <span>Local time</span>
          </div>

          <div className="flex items-center gap-2">
            <span>
              {totalCount} appointments • {actionableCount} actionable
            </span>
            <button
              type="button"
              onClick={fetchAppointments}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/60 px-2 py-1 text-[11px] text-slate-200 hover:bg-slate-900"
              title="Refresh"
            >
              <RefreshCwIcon size={14} />
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-6 text-center text-xs text-slate-400">
            Loading today&apos;s appointments…
          </div>
        ) : error ? (
          <div className="flex items-start gap-2 rounded-2xl border border-amber-500/40 bg-amber-500/5 px-3 py-3 text-xs text-amber-100">
            <AlertCircleIcon size={14} className="mt-0.5" />
            <div>
              <p className="font-semibold">Couldn&apos;t load appointments</p>
              <p className="mt-0.5 text-[11px] opacity-90">{error}</p>
            </div>
          </div>
        ) : appointments.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">
            No appointments scheduled for today.
          </div>
        ) : (
          <div className="overflow-x-auto text-xs">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="text-left text-[11px] text-slate-400 border-b border-slate-800">
                  <th className="py-2 pr-4 font-medium">Time</th>
                  <th className="py-2 pr-4 font-medium">Patient</th>
                  <th className="py-2 pr-4 font-medium">Reason</th>
                  <th className="py-2 pr-4 font-medium">Room</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 pr-4 font-medium">Actions</th>
                  <th className="py-2 pr-2 font-medium text-right">ID</th>
                </tr>
              </thead>

              <tbody>
                {appointments.map((a) => {
                  const showButton = canCompleteStatus(a.status);

                  return (
                    <tr
                      key={a.dbId}
                      className="border-b border-slate-900 last:border-b-0 hover:bg-slate-900/70 transition"
                    >
                      <td className="py-2 pr-4 align-top">
                        <div className="inline-flex rounded-full border border-slate-700 px-2 py-0.5 font-mono text-[11px] text-slate-200">
                          {a.date || "—"} · {a.time || "--:--"}
                        </div>
                      </td>

                      <td className="py-2 pr-4 align-top text-slate-50">
                        {a.patient}
                      </td>
                      <td className="py-2 pr-4 align-top text-slate-300">
                        {a.reason}
                      </td>
                      <td className="py-2 pr-4 align-top text-slate-400">
                        {a.room || "—"}
                      </td>

                      <td className="py-2 pr-4 align-top">
                        <span
                          className={[
                            "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border",
                            statusPillClass(a.status),
                          ].join(" ")}
                        >
                          {a.status}
                        </span>
                      </td>

                      <td className="py-2 pr-4 align-top">
                        {showButton ? (
                          <button
                            type="button"
                            disabled={completingId === a.dbId}
                            onClick={() => markCompleted(a.dbId)}
                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-2 py-1 text-[11px] font-semibold text-emerald-100 hover:bg-emerald-500/15 disabled:opacity-60"
                          >
                            <CheckCircle2Icon size={14} />
                            {completingId === a.dbId
                              ? "Completing..."
                              : "Mark completed"}
                          </button>
                        ) : (
                          // ✅ debug hint (remove later if you want)
                          <span className="text-[11px] text-slate-500">
                            —{" "}
                            <span className="opacity-70">
                              (status: {String(a.status || "null")})
                            </span>
                          </span>
                        )}
                      </td>

                      <td className="py-2 pr-2 align-top text-right text-slate-500 font-mono">
                        {a.id}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </DoctorLayout>
  );
};
