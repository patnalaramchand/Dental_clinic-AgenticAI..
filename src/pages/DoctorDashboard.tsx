import React, { useEffect, useState } from 'react';
import {
  CalendarClockIcon,
  ActivityIcon,
  UsersIcon,
  ClipboardListIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { DoctorLayout } from '../layouts/doctor/DoctorLayout';

// ---- Types matching your backend responses ----

type DoctorAppointment = {
  id: string | number;
  date: string | null;
  time: string | null;
  patient: string;
  reason: string;
  room: string;
  status: string;
};

type DoctorCase = {
  id: string;
  patientName: string;
  toothRegion: string;
  diagnosis: string;
  stage: string; // e.g. 'NEW', 'IN_TREATMENT', 'CLOSED'
  createdAt: string | null;
  updatedAt: string | null;
};

type DoctorPatient = {
  id: string;
  name: string;
  lastVisit: string | null;
  activeCases: number;
};

type AppointmentsResponse = {
  items: DoctorAppointment[];
  date: string;
  message?: string;
};

type CasesResponse = {
  cases: DoctorCase[];
  message?: string;
};

type PatientsResponse = {
  items: DoctorPatient[];
  message?: string;
};

// ---- Helper: API base + fetch with auth header ----

const API_BASE_URL =
  (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:4000';

async function fetchWithAuth<T>(path: string): Promise<T> {
  // tolerate both keys: 'authToken' and 'token'
  const token =
    localStorage.getItem('authToken') || localStorage.getItem('token');

  if (!token) {
    const err: any = new Error('No auth token in localStorage');
    err.code = 'NO_TOKEN';
    throw err;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
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
    const data = await res.json().catch(() => ({}));
    const err: any = new Error(
      data.message || `Request failed with status ${res.status}`,
    );
    err.status = res.status;
    throw err;
  }

  return res.json() as Promise<T>;
}

export const DoctorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const userName = localStorage.getItem('userName') || 'Doctor';

  const [appointments, setAppointments] = useState<DoctorAppointment[]>([]);
  const [cases, setCases] = useState<DoctorCase[]>([]);
  const [patients, setPatients] = useState<DoctorPatient[]>([]);

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setErrorMsg(null);

        // Load real data from your existing doctor routes
        const [apptData, caseData, patientData] = await Promise.all([
          fetchWithAuth<AppointmentsResponse>('/api/doctor/appointments'),
          fetchWithAuth<CasesResponse>('/api/doctor/cases'),
          fetchWithAuth<PatientsResponse>('/api/doctor/patients'),
        ]);

        if (cancelled) return;

        setAppointments(apptData.items || []);
        setCases(caseData.cases || []);
        setPatients(patientData.items || []);
      } catch (err: any) {
        if (cancelled) return;
        console.error('DOCTOR DASHBOARD LOAD ERROR', err);

        if (err.code === 'NO_TOKEN' || err.status === 401) {
          // token really missing / expired
          setErrorMsg('Session expired. Please log in again.');
          navigate('/login?role=doctor');
        } else if (err.status === 403) {
          setErrorMsg('You do not have permission for this view.');
        } else if (err.message) {
          setErrorMsg(err.message);
        } else {
          setErrorMsg('Failed to load doctor dashboard.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  // ---- Derive quick stats from real data ----

  const totalAppts = appointments.length;

  const nonCancelledAppts = appointments.filter(
    (a) => a.status !== 'Cancelled',
  );
  const completedAppts = appointments.filter(
    (a) => a.status === 'Completed',
  );
  const completionRate =
    nonCancelledAppts.length > 0
      ? Math.round(
          (completedAppts.length / nonCancelledAppts.length) * 100,
        )
      : 0;

  const openCasesCount = cases.filter(
    (c) => c.stage !== 'CLOSED' && c.stage !== 'COMPLETED',
  ).length;

  const newPatientsLast30d = patients.length; // if you add created_at later, you can refine this

  const quickStats = {
    todayCount: totalAppts,
    openCases: openCasesCount,
    newPatients: newPatientsLast30d,
    completionRate,
  };

  const surface =
    'rounded-2xl border border-neutral-200 bg-white/95 dark:border-neutral-800 dark:bg-neutral-900/95 shadow-sm transition-colors duration-150';
  const softSurface =
    'rounded-2xl border border-neutral-200 bg-white/90 dark:border-neutral-800 dark:bg-neutral-900/90 transition-colors duration-150';

  return (
    <DoctorLayout>
      {/* subtle background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-32 left-10 h-72 w-72 rounded-full bg-neutral-200/70 dark:bg-neutral-800/70 blur-3xl" />
        <div className="absolute top-24 right-20 h-64 w-64 rounded-full bg-neutral-100/80 dark:bg-neutral-800/80 blur-3xl" />
      </div>

      {/* Header */}
      <section
        className={[
          'mb-6 rounded-2xl px-5 py-4',
          'border border-neutral-200 bg-gradient-to-br from-white via-white to-neutral-50',
          'dark:border-neutral-800 dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-900',
          'shadow-[0_26px_90px_-70px_rgba(0,0,0,0.65)]',
          'transition-colors duration-150',
        ].join(' ')}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.2em] text-emerald-700 dark:text-emerald-400 uppercase mb-1.5">
              Today&apos;s workspace
            </p>
            <h1 className="text-xl sm:text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
              Good day, {userName}. Here&apos;s your clinical overview.
            </h1>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300 max-w-xl">
              Quick snapshot of today&apos;s schedule, active cases, and key
              practice signals.
            </p>
          </div>
        </div>
      </section>

      {/* Error / loading */}
      {errorMsg && (
        <div className="mb-4 rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950/40 dark:text-red-200">
          {errorMsg}
        </div>
      )}
      {loading && !errorMsg && (
        <div className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
          Loading dashboard…
        </div>
      )}

      {/* Only render main content when not loading */}
      {!loading && !errorMsg && (
        <>
          {/* Quick stats */}
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            <div className={`${surface} px-4 py-3 flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-2xl bg-emerald-500/10 border border-emerald-400/40 grid place-items-center">
                  <CalendarClockIcon
                    size={18}
                    className="text-emerald-700 dark:text-emerald-300"
                  />
                </div>
                <div>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    Appointments today
                  </p>
                  <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                    {quickStats.todayCount}
                  </p>
                </div>
              </div>
              <Link
                to="/doctor/appointments"
                className="text-[11px] text-emerald-700 dark:text-emerald-300 hover:underline"
              >
                View
              </Link>
            </div>

            <div className={`${surface} px-4 py-3 flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-2xl bg-sky-500/10 border border-sky-400/40 grid place-items-center">
                  <ClipboardListIcon
                    size={18}
                    className="text-sky-700 dark:text-sky-300"
                  />
                </div>
                <div>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    Open cases
                  </p>
                  <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                    {quickStats.openCases}
                  </p>
                </div>
              </div>
              <Link
                to="/doctor/cases"
                className="text-[11px] text-sky-700 dark:text-sky-300 hover:underline"
              >
                View
              </Link>
            </div>

            <div className={`${surface} px-4 py-3 flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-2xl bg-violet-500/10 border border-violet-400/40 grid place-items-center">
                  <UsersIcon
                    size={18}
                    className="text-violet-700 dark:text-violet-300"
                  />
                </div>
                <div>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    Patients in panel
                  </p>
                  <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                    {patients.length}
                  </p>
                </div>
              </div>
              <Link
                to="/doctor/patients"
                className="text-[11px] text-violet-700 dark:text-violet-300 hover:underline"
              >
                View
              </Link>
            </div>

            <div className={`${surface} px-4 py-3 flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-2xl bg-amber-500/10 border border-amber-400/40 grid place-items-center">
                  <ActivityIcon
                    size={18}
                    className="text-amber-700 dark:text-amber-300"
                  />
                </div>
                <div>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    Completion rate
                  </p>
                  <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                    {quickStats.completionRate}%
                  </p>
                </div>
              </div>
              <Link
                to="/doctor/insights"
                className="text-[11px] text-amber-700 dark:text-amber-200 hover:underline"
              >
                Details
              </Link>
            </div>
          </section>

          {/* Main grid */}
          <section className="grid grid-cols-1 xl:grid-cols-[1.6fr,1fr] gap-6">
            {/* Today schedule */}
            <div className={`${surface} px-5 py-4`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CalendarClockIcon
                    size={18}
                    className="text-emerald-700 dark:text-emerald-300"
                  />
                  <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                    Today&apos;s schedule
                  </h2>
                </div>
                <Link
                  to="/doctor/appointments"
                  className="text-[11px] text-neutral-500 dark:text-neutral-300 hover:underline"
                >
                  Open full view
                </Link>
              </div>

              <ul className="space-y-3 text-xs">
                {appointments.map((apt) => (
                  <li
                    key={apt.id}
                    className="flex items-start justify-between rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 px-3 py-2.5 transition-colors duration-150"
                  >
                    <div className="flex gap-3">
                      <div className="mt-0.5">
                        <div className="px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-[11px] font-mono text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700">
                          {apt.time || '--:--'}
                        </div>
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900 dark:text-neutral-50">
                          {apt.patient}
                        </p>
                        <p className="text-neutral-600 dark:text-neutral-300 mt-0.5">
                          {apt.reason}
                        </p>
                        <p className="text-neutral-500 dark:text-neutral-400 mt-0.5">
                          {apt.room} • {apt.id}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <span
                        className={[
                          'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border',
                          apt.status === 'Confirmed'
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-400/60'
                            : apt.status === 'In progress'
                            ? 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-400/60'
                            : apt.status === 'Completed'
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-400/60'
                            : apt.status === 'Cancelled'
                            ? 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-400/60'
                            : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 border-neutral-200 dark:border-neutral-700',
                        ].join(' ')}
                      >
                        {apt.status}
                      </span>
                      <button className="text-[11px] text-emerald-700 dark:text-emerald-300 hover:underline">
                        Open chart
                      </button>
                    </div>
                  </li>
                ))}
                {appointments.length === 0 && (
                  <li className="text-xs text-neutral-500 dark:text-neutral-400">
                    No appointments scheduled for today.
                  </li>
                )}
              </ul>
            </div>

            {/* Right column */}
            <div className="space-y-4">
              {/* Active cases summary */}
              <div className={`${softSurface} px-4 py-4`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ClipboardListIcon
                      size={18}
                      className="text-sky-700 dark:text-sky-300"
                    />
                    <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                      Active cases
                    </h2>
                  </div>
                  <Link
                    to="/doctor/cases"
                    className="text-[11px] text-sky-700 dark:text-sky-300 hover:underline"
                  >
                    All cases
                  </Link>
                </div>

                <p className="text-xs text-neutral-600 dark:text-neutral-300">
                  You currently have{' '}
                  <span className="font-semibold">{quickStats.openCases}</span>{' '}
                  open treatment cases assigned. Go to the cases view to manage
                  progress and notes.
                </p>
              </div>

              {/* Quick signals */}
              <div className={`${softSurface} px-4 py-4`}>
                <div className="flex items-center gap-2 mb-3">
                  <ActivityIcon
                    size={18}
                    className="text-amber-700 dark:text-amber-300"
                  />
                  <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                    Quick signals
                  </h2>
                </div>
                <ul className="space-y-2 text-[11px] text-neutral-700 dark:text-neutral-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2Icon
                      size={13}
                      className="mt-0.5 text-emerald-700 dark:text-emerald-300"
                    />
                    <span>
                      {quickStats.todayCount > 0
                        ? 'Today’s schedule is ready; appointments are visible in your list.'
                        : 'No appointments booked for today yet.'}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertCircleIcon
                      size={13}
                      className="mt-0.5 text-amber-700 dark:text-amber-300"
                    />
                    <span>
                      {quickStats.openCases > 0
                        ? 'You have ongoing treatment cases that may need follow-up this week.'
                        : 'No active treatment cases currently assigned.'}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ActivityIcon
                      size={13}
                      className="mt-0.5 text-sky-700 dark:text-sky-300"
                    />
                    <span>
                      Recent completion rate is around{' '}
                      <span className="font-semibold">
                        {quickStats.completionRate}%
                      </span>{' '}
                      based on your recent appointments.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </section>
        </>
      )}
    </DoctorLayout>
  );
};
