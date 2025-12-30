import React, { useEffect, useMemo, useState } from "react";

import {
  CalendarDaysIcon,
  FilterIcon,
  SearchIcon,
  ClockIcon,
  UserIcon,
  XIcon,
  Loader2Icon,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
const ADMIN_API = `${API_BASE}/api/admin`;

function getAuthHeaders() {
  const token = localStorage.getItem("authToken");
  return token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" };
}

/** ✅ Local timezone YYYY-MM-DD (NOT UTC) */
function localYYYYMMDD(d: Date = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** ✅ Display date safely even if backend sends ISO like 2025-12-17T18:30:00.000Z */
function displayDate(val: any) {
  if (!val) return "—";
  const s = String(val);

  // already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  // ISO or Date-like
  const dt = new Date(s);
  if (!Number.isNaN(dt.getTime())) return localYYYYMMDD(dt);

  // fallback
  return s.slice(0, 10);
}

type AppointmentRow = {
  id: string;
  date: string;
  time: string;
  patient: string;
  doctor: string;
  type: string;
  status: string;
};

type UserOption = {
  id: string; // UID, e.g. PT-1234 or DC-5678
  name: string;
  phone?: string | null;
};

type CreateAppointmentForm = {
  patientUid: string;
  doctorUid: string;
  date: string;
  time: string;
  type: string;
  status: string;
};

type SuggestedSlot = {
  date: string;
  startTime: string;
  endTime: string;
  predictedDurationMin: number;
};

export const AdminAppointments: React.FC = () => {
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ Use local "today" (NOT UTC)
  const todayStr = useMemo(() => localYYYYMMDD(new Date()), []);

  // Modal + create state
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<CreateAppointmentForm>(() => {
    return {
      patientUid: "",
      doctorUid: "",
      date: localYYYYMMDD(new Date()), // ✅ local
      time: "10:00",
      type: "General consultation",
      status: "Confirmed",
    };
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // ✅ store suggested slots from 409 response
  const [suggestedSlots, setSuggestedSlots] = useState<SuggestedSlot[]>([]);

  // Dropdown data
  const [patients, setPatients] = useState<UserOption[]>([]);
  const [doctors, setDoctors] = useState<UserOption[]>([]);
  const [peopleLoading, setPeopleLoading] = useState(false);
  const [peopleError, setPeopleError] = useState<string | null>(null);

  // Search inside dropdowns
  const [patientSearch, setPatientSearch] = useState("");
  const [doctorSearch, setDoctorSearch] = useState("");

  // re-load appointments after create
  const [refreshKey, setRefreshKey] = useState(0);

  // Load appointments for today
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `${ADMIN_API}/appointments?date=${encodeURIComponent(todayStr)}`,
          { headers: getAuthHeaders() }
        );
        if (!res.ok) throw new Error(`Status ${res.status}`);

        const data = await res.json();
        setAppointments(data.items || []);
      } catch (err) {
        console.error("AdminAppointments error:", err);
        setError("Failed to load appointments.");
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [todayStr, refreshKey]);

  // Load patients + doctors when modal opens (lazy load)
  useEffect(() => {
    if (!showCreate) return;
    if (patients.length > 0 && doctors.length > 0) return;

    const loadPeople = async () => {
      try {
        setPeopleLoading(true);
        setPeopleError(null);

        const resPatients = await fetch(`${ADMIN_API}/patients`, {
          headers: getAuthHeaders(),
        });
        if (!resPatients.ok) throw new Error(`Patients status ${resPatients.status}`);
        const dataPatients = await resPatients.json();
        const patientItems: UserOption[] = (dataPatients.items || []).map((p: any) => ({
          id: p.id,
          name: p.name || p.full_name || "Unknown patient",
          phone: p.phone ?? null,
        }));

        const resDoctors = await fetch(`${ADMIN_API}/doctors`, {
          headers: getAuthHeaders(),
        });
        if (!resDoctors.ok) throw new Error(`Doctors status ${resDoctors.status}`);
        const dataDoctors = await resDoctors.json();
        const doctorItems: UserOption[] = (dataDoctors.items || []).map((d: any) => ({
          id: d.id,
          name: d.name || d.full_name || "Unknown doctor",
          phone: d.phone ?? null,
        }));

        setPatients(patientItems);
        setDoctors(doctorItems);

        setCreateForm((prev) => ({
          ...prev,
          patientUid: prev.patientUid || patientItems[0]?.id || "",
          doctorUid: prev.doctorUid || doctorItems[0]?.id || "",
        }));
      } catch (err: any) {
        console.error("AdminAppointments people load error:", err);
        setPeopleError(err?.message || "Failed to load patient / doctor lists. Check admin API.");
      } finally {
        setPeopleLoading(false);
      }
    };

    loadPeople();
  }, [showCreate, patients.length, doctors.length]);

  const filtered = appointments.filter((apt) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      String(apt.id).toLowerCase().includes(q) ||
      String(apt.patient).toLowerCase().includes(q) ||
      String(apt.doctor).toLowerCase().includes(q)
    );
  });

  const filteredPatients = patients.filter((p) => {
    if (!patientSearch.trim()) return true;
    const q = patientSearch.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q) ||
      (p.phone || "").toLowerCase().includes(q)
    );
  });

  const filteredDoctors = doctors.filter((d) => {
    if (!doctorSearch.trim()) return true;
    const q = doctorSearch.toLowerCase();
    return (
      d.name.toLowerCase().includes(q) ||
      d.id.toLowerCase().includes(q) ||
      (d.phone || "").toLowerCase().includes(q)
    );
  });

  function openCreateModal() {
    setCreateError(null);
    setPeopleError(null);
    setSuggestedSlots([]);
    // ✅ default date = local today each time modal opens
    setCreateForm((prev) => ({ ...prev, date: localYYYYMMDD(new Date()) }));
    setShowCreate(true);
  }

  function closeCreateModal() {
    if (creating) return;
    setShowCreate(false);
  }

  async function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    setSuggestedSlots([]);

    const { patientUid, doctorUid, date, time, type, status } = createForm;

    if (!patientUid || !doctorUid) {
      setCreateError("Please select both patient and doctor.");
      return;
    }
    if (!date || !time) {
      setCreateError("Date and time are required.");
      return;
    }

    try {
      setCreating(true);

      const res = await fetch(`${ADMIN_API}/appointments`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          patientUid,
          doctorUid,
          date,
          time,
          type: type.trim() || "General consultation",
          status,
        }),
      });

      // ✅ handle 409 nicely
      if (!res.ok) {
        const contentType = res.headers.get("content-type") || "";
        const body = contentType.includes("application/json")
          ? await res.json()
          : { message: await res.text() };

        console.error("Create appointment error body:", body);

        if (res.status === 409 && body?.conflict) {
          setCreateError(body?.message || "Time slot conflict.");
          setSuggestedSlots(body?.suggestedSlots || []);
          setCreating(false);
          return;
        }

        throw new Error(body?.message || `Failed to create appointment (status ${res.status}).`);
      }

      setShowCreate(false);
      setCreating(false);
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      console.error("Create appointment error:", err);
      setCreating(false);
      setCreateError(err?.message || "Could not create appointment. Please check server logs.");
    }
  }

  function pickSuggestedSlot(slot: SuggestedSlot) {
    setCreateForm((f) => ({
      ...f,
      date: slot.date,
      time: slot.startTime.slice(0, 5), // "HH:MM"
    }));
    setCreateError(null);
  }

  return (
    <>
      <section className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 px-3 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              <CalendarDaysIcon size={14} />
              <span>Appointments</span>
            </div>
            <h1 className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-50">
              Schedule overview
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              View and manage clinic appointments across all providers.
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              Date: <span className="font-mono">{todayStr}</span>
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 px-3 py-1.5 text-slate-700 dark:text-slate-200"
            >
              <FilterIcon size={14} />
              <span>Filters</span>
            </button>
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-1 rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950 px-3 py-1.5 font-semibold shadow-sm hover:bg-slate-800 dark:hover:bg-slate-200 transition"
            >
              + New appointment
            </button>
          </div>
        </div>

        {/* Search + meta bar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs">
          <div className="relative w-full md:max-w-xs">
            <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 dark:text-slate-500">
              <SearchIcon size={14} />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by patient, doctor, or ID"
              className="w-full rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 pl-8 pr-3 py-2 text-sm text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-900/5 dark:focus:ring-white/10"
            />
          </div>

          <div className="flex flex-wrap gap-2 text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80">
              <ClockIcon size={12} />
              Today
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80">
              <UserIcon size={12} />
              All doctors
            </span>
          </div>
        </div>

        {error && (
          <p className="text-xs text-rose-500 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2 dark:bg-rose-950/40 dark:border-rose-900/60">
            {error}
          </p>
        )}

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-900 bg-white/90 dark:bg-slate-950/90 shadow-sm">
          <table className="min-w-full text-xs">
            <thead className="bg-slate-50/90 dark:bg-slate-900/90 border-b border-slate-200/80 dark:border-slate-800/80">
              <tr className="text-left text-slate-500 dark:text-slate-400">
                <th className="px-4 py-2 font-semibold">ID</th>
                <th className="px-4 py-2 font-semibold">Date</th>
                <th className="px-4 py-2 font-semibold">Time</th>
                <th className="px-4 py-2 font-semibold">Patient</th>
                <th className="px-4 py-2 font-semibold">Doctor</th>
                <th className="px-4 py-2 font-semibold">Type</th>
                <th className="px-4 py-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-4 text-center text-slate-400">
                    Loading appointments...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-4 text-center text-slate-400">
                    No appointments found.
                  </td>
                </tr>
              ) : (
                filtered.map((apt) => (
                  <tr
                    key={apt.id}
                    className="border-b border-slate-100/80 dark:border-slate-900/80 last:border-b-0 hover:bg-slate-50/80 dark:hover:bg-slate-900/80"
                  >
                    <td className="px-4 py-2 text-slate-700 dark:text-slate-200">{apt.id}</td>
                    <td className="px-4 py-2 text-slate-700 dark:text-slate-200">
                      {displayDate(apt.date)}
                    </td>
                    <td className="px-4 py-2 text-slate-700 dark:text-slate-200">{apt.time}</td>
                    <td className="px-4 py-2 text-slate-700 dark:text-slate-200">{apt.patient}</td>
                    <td className="px-4 py-2 text-slate-700 dark:text-slate-200">{apt.doctor}</td>
                    <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{apt.type}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          apt.status === "Confirmed"
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-200 border border-emerald-500/30"
                            : apt.status === "Checked in"
                            ? "bg-sky-500/10 text-sky-700 dark:text-sky-200 border border-sky-500/30"
                            : apt.status === "Completed"
                            ? "bg-slate-900 text-slate-50 dark:bg-slate-100 dark:text-slate-950"
                            : apt.status === "Cancelled"
                            ? "bg-amber-500/10 text-amber-700 dark:text-amber-200 border border-amber-500/30"
                            : "bg-slate-200/60 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        }`}
                      >
                        {apt.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* CREATE APPOINTMENT MODAL */}
      {showCreate && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-50">New appointment</h2>
              <button
                type="button"
                onClick={closeCreateModal}
                className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-slate-100"
              >
                <XIcon size={16} />
              </button>
            </div>

            <p className="text-[11px] text-slate-400 mb-3">
              Book an appointment for a patient with a selected doctor.
            </p>

            {peopleError && (
              <p className="mb-2 text-[11px] text-amber-300 bg-amber-950/40 border border-amber-900/60 rounded-lg px-3 py-2">
                {peopleError}
              </p>
            )}

            {createError && (
              <p className="mb-2 text-[11px] text-rose-400 bg-rose-950/40 border border-rose-900/60 rounded-lg px-3 py-2">
                {createError}
              </p>
            )}

            {/* ✅ show suggested slots when conflict */}
            {suggestedSlots.length > 0 && (
              <div className="mb-3 rounded-xl border border-slate-800 bg-slate-900/40 p-3">
                <p className="text-[11px] text-slate-300 font-semibold mb-2">
                  Suggested available slots (click one to fill):
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggestedSlots.slice(0, 8).map((s, idx) => (
                    <button
                      key={`${s.date}-${s.startTime}-${idx}`}
                      type="button"
                      onClick={() => pickSuggestedSlot(s)}
                      className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-[11px] text-slate-200 hover:bg-slate-800"
                    >
                      {s.startTime.slice(0, 5)}–{s.endTime.slice(0, 5)}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 mt-2">
                  (Showing first 8 suggestions)
                </p>
              </div>
            )}

            <form className="space-y-3 text-xs text-slate-100" onSubmit={handleCreateSubmit}>
              {/* Patient */}
              <div className="space-y-1">
                <label className="block text-[11px] text-slate-300">Patient</label>
                <input
                  type="text"
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  placeholder="Search patient by name, UID, or phone"
                  className="mb-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-[11px] focus:outline-none focus:ring-2 focus:ring-slate-500"
                />
                <select
                  value={createForm.patientUid}
                  onChange={(e) => setCreateForm((f) => ({ ...f, patientUid: e.target.value }))}
                  disabled={peopleLoading || patients.length === 0}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-slate-500 disabled:opacity-60"
                >
                  <option value="">
                    {peopleLoading
                      ? "Loading patients..."
                      : filteredPatients.length === 0
                      ? "No patients match search"
                      : "Select patient"}
                  </option>
                  {filteredPatients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.id})
                    </option>
                  ))}
                </select>
              </div>

              {/* Doctor */}
              <div className="space-y-1">
                <label className="block text-[11px] text-slate-300">Doctor</label>
                <input
                  type="text"
                  value={doctorSearch}
                  onChange={(e) => setDoctorSearch(e.target.value)}
                  placeholder="Search doctor by name, UID, or phone"
                  className="mb-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-[11px] focus:outline-none focus:ring-2 focus:ring-slate-500"
                />
                <select
                  value={createForm.doctorUid}
                  onChange={(e) => setCreateForm((f) => ({ ...f, doctorUid: e.target.value }))}
                  disabled={peopleLoading || doctors.length === 0}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-slate-500 disabled:opacity-60"
                >
                  <option value="">
                    {peopleLoading
                      ? "Loading doctors..."
                      : filteredDoctors.length === 0
                      ? "No doctors match search"
                      : "Select doctor"}
                  </option>
                  {filteredDoctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.id})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date + Time */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] text-slate-300">Date</label>
                  <input
                    type="date"
                    value={createForm.date}
                    onChange={(e) => setCreateForm((f) => ({ ...f, date: e.target.value }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-slate-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] text-slate-300">Time</label>
                  <input
                    type="time"
                    value={createForm.time}
                    onChange={(e) => setCreateForm((f) => ({ ...f, time: e.target.value }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-slate-500"
                  />
                </div>
              </div>

              {/* Type */}
              <div className="space-y-1">
                <label className="block text-[11px] text-slate-300">Visit type</label>
                <input
                  type="text"
                  value={createForm.type}
                  onChange={(e) => setCreateForm((f) => ({ ...f, type: e.target.value }))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-slate-500"
                  placeholder="e.g. Implant consultation"
                />
              </div>

              {/* Status */}
              <div className="space-y-1">
                <label className="block text-[11px] text-slate-300">Status</label>
                <select
                  value={createForm.status}
                  onChange={(e) => setCreateForm((f) => ({ ...f, status: e.target.value }))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-slate-500"
                >
                  <option value="Confirmed">Confirmed</option>
                  <option value="Checked in">Checked in</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Requested">Requested</option>
                </select>
              </div>

              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  disabled={creating}
                  className="px-3 py-1.5 rounded-lg text-[11px] text-slate-300 hover:bg-slate-800 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || peopleLoading || patients.length === 0 || doctors.length === 0}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500 text-xs font-semibold text-emerald-950 hover:bg-emerald-400 disabled:opacity-60"
                >
                  {creating && <Loader2Icon size={14} className="animate-spin" />}
                  <span>Create appointment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
