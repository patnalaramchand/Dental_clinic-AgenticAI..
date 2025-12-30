// src/layouts/admin/AdminCases.tsx
import React, { useEffect, useMemo, useState } from "react";

import {
  ClipboardList as ClipboardListIcon,
  Filter as FilterIcon,
  Search as SearchIcon,
  Activity as ActivityIcon,
  User as UserIcon,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
const ADMIN_API = `${API_BASE}/api/admin`;

function getAuthHeaders() {
  const token = localStorage.getItem("authToken");
  return token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" };
}

// Canonical case stages (same as AdminCaseTracking)
type CaseStage =
  | "NEW"
  | "IN_TREATMENT"
  | "WAITING_ON_PATIENT"
  | "READY_TO_CLOSE"
  | "CLOSED"
  | "BLOCKED";

const stageLabel: Record<CaseStage, string> = {
  NEW: "New",
  IN_TREATMENT: "In treatment",
  WAITING_ON_PATIENT: "Waiting on patient",
  READY_TO_CLOSE: "Ready to close",
  CLOSED: "Closed",
  BLOCKED: "Blocked",
};

type CaseCard = {
  id: string;
  patient: string;
  doctor: string;
  type: string;
  stage: CaseStage;
};

const normalizeStage = (stage: string | null | undefined): CaseStage => {
  const upper = (stage || "NEW").toUpperCase();
  switch (upper) {
    case "IN_TREATMENT":
      return "IN_TREATMENT";
    case "WAITING_ON_PATIENT":
      return "WAITING_ON_PATIENT";
    case "READY_TO_CLOSE":
      return "READY_TO_CLOSE";
    case "CLOSED":
      return "CLOSED";
    case "BLOCKED":
      return "BLOCKED";
    default:
      return "NEW";
  }
};

const stagePillClass = (stage: CaseStage) => {
  switch (stage) {
    case "NEW":
      return "bg-sky-500/10 text-sky-700 dark:text-sky-200 border border-sky-500/30";
    case "IN_TREATMENT":
      return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-200 border border-emerald-500/30";
    case "WAITING_ON_PATIENT":
      return "bg-amber-500/10 text-amber-700 dark:text-amber-200 border border-amber-500/30";
    case "READY_TO_CLOSE":
      return "bg-violet-500/10 text-violet-700 dark:text-violet-200 border border-violet-500/30";
    case "CLOSED":
      return "bg-slate-900 text-slate-50 dark:bg-slate-100 dark:text-slate-950";
    case "BLOCKED":
      return "bg-rose-500/10 text-rose-700 dark:text-rose-200 border border-rose-500/30";
    default:
      return "bg-slate-700 text-slate-50";
  }
};

export const AdminCases: React.FC = () => {
  const [cases, setCases] = useState<CaseCard[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCases = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${ADMIN_API}/cases`, {
          headers: getAuthHeaders(),
        });
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();

        const mapped: CaseCard[] = (data.items || []).map((c: any) => ({
          id: c.id,
          patient: c.patient,
          doctor: c.doctor,
          type: c.type,
          stage: normalizeStage(c.stage),
        }));

        setCases(mapped);
      } catch (err) {
        console.error("AdminCases error:", err);
        setError("Failed to load cases.");
      } finally {
        setLoading(false);
      }
    };

    fetchCases();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return cases;
    const q = search.toLowerCase();
    return cases.filter((c) => {
      return (
        c.id.toLowerCase().includes(q) ||
        c.patient.toLowerCase().includes(q) ||
        c.doctor.toLowerCase().includes(q) ||
        c.type.toLowerCase().includes(q)
      );
    });
  }, [cases, search]);

  const pipelineCounts = useMemo(() => {
    const counts: Record<CaseStage, number> = {
      NEW: 0,
      IN_TREATMENT: 0,
      WAITING_ON_PATIENT: 0,
      READY_TO_CLOSE: 0,
      CLOSED: 0,
      BLOCKED: 0,
    };
    for (const c of cases) {
      counts[c.stage] += 1;
    }
    return counts;
  }, [cases]);

  return (
    <>
      <section className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 px-3 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              <ClipboardListIcon size={14} />
              <span>Case tracking</span>
            </div>
            <h1 className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-50">
              Case pipeline overview
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Monitor every active case from creation to closure across all doctors.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <button className="inline-flex items-center gap-1 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 px-3 py-1.5 text-slate-700 dark:text-slate-200">
              <FilterIcon size={14} />
              Filters
            </button>
          </div>
        </div>

        {/* Pipeline summary – now based on canonical stages */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 p-3">
            <p className="text-slate-500 dark:text-slate-400">
              {stageLabel.NEW}
            </p>
            <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-50">
              {pipelineCounts.NEW}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 p-3">
            <p className="text-slate-500 dark:text-slate-400">
              {stageLabel.IN_TREATMENT}
            </p>
            <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-50">
              {pipelineCounts.IN_TREATMENT}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 p-3">
            <p className="text-slate-500 dark:text-slate-400">
              {stageLabel.WAITING_ON_PATIENT}
            </p>
            <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-50">
              {pipelineCounts.WAITING_ON_PATIENT}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 p-3">
            <p className="text-slate-500 dark:text-slate-400">
              {stageLabel.READY_TO_CLOSE}
            </p>
            <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-50">
              {pipelineCounts.READY_TO_CLOSE}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 p-3">
            <p className="text-slate-500 dark:text-slate-400">
              {stageLabel.CLOSED}
            </p>
            <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-50">
              {pipelineCounts.CLOSED}
            </p>
          </div>
        </div>

        {/* Search + chips */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs">
          <div className="relative w-full md:max-w-xs">
            <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 dark:text-slate-500">
              <SearchIcon size={14} />
            </span>
            <input
              type="text"
              placeholder="Search by patient, doctor, or case ID"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 pl-8 pr-3 py-2 text-sm text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-900/5 dark:focus:ring-white/10"
            />
          </div>

          <div className="flex flex-wrap gap-2 text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80">
              <UserIcon size={12} />
              All doctors
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80">
              <ActivityIcon size={12} />
              All stages
            </span>
          </div>
        </div>

        {error && (
          <p className="text-xs text-rose-500 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
            {error}
          </p>
        )}

        {/* Cases grid */}
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full text-center text-xs text-slate-400 py-4">
              Loading cases...
            </div>
          ) : filtered.length === 0 ? (
            <div className="col-span-full text-center text-xs text-slate-400 py-4">
              No cases found.
            </div>
          ) : (
            filtered.map((c) => (
              <div
                key={c.id}
                className="rounded-2xl border border-slate-200/80 dark:border-slate-900 bg-white/90 dark:bg-slate-950/90 p-4 shadow-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    {c.id}
                  </p>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${stagePillClass(
                      c.stage
                    )}`}
                  >
                    {stageLabel[c.stage]}
                  </span>
                </div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  {c.type}
                </p>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                  {c.patient}
                </p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Primary doctor:{" "}
                  <span className="font-medium">{c.doctor}</span>
                </p>
              </div>
            ))
          )}
        </div>
      </section>
    </>
  );
};
