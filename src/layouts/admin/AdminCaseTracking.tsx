// src/layouts/admin/AdminCaseTracking.tsx
import React, { useEffect, useMemo, useState } from "react";

import {
  ActivityIcon,
  AlertTriangleIcon,
  ClipboardListIcon,
  ClockIcon,
  FilterIcon,
  SearchIcon,
  UserIcon,
  ZapIcon,
} from "lucide-react";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
const ADMIN_API = `${API_BASE}/api/admin`;

type CaseStage =
  | "NEW"
  | "IN_TREATMENT"
  | "WAITING_ON_PATIENT"
  | "READY_TO_CLOSE"
  | "CLOSED"
  | "BLOCKED";

type CasePriority = "LOW" | "MEDIUM" | "HIGH";

interface CaseTrackingSummary {
  totalCases: number;
  highRiskCount: number;
  needsFollowUpCount: number;
  byStage: Partial<Record<CaseStage, number>>;
  updatedAt: string | null;
}

interface TrackedCase {
  id: number;
  caseId: string;
  patientName: string;
  patientUid?: string | null;
  doctorName: string;
  doctorUid?: string | null;
  type: string;
  stage: CaseStage;
  priority: CasePriority;
  riskScore: number;
  nextAction: string | null;
  nextReviewDate: string | null;
  lastUpdated: string;
  agentSummary?: string | null;
  agentRecommendation?: string | null;
  flagged?: boolean;
}

const stageLabel: Record<CaseStage, string> = {
  NEW: "New",
  IN_TREATMENT: "In treatment",
  WAITING_ON_PATIENT: "Waiting on patient",
  READY_TO_CLOSE: "Ready to close",
  CLOSED: "Closed",
  BLOCKED: "Blocked",
};

const priorityLabel: Record<CasePriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

export const AdminCaseTracking: React.FC = () => {
  const [summary, setSummary] = useState<CaseTrackingSummary | null>(null);
  const [cases, setCases] = useState<TrackedCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingCaseId, setUpdatingCaseId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<CaseStage | "ALL">("ALL");
  const [riskFilter, setRiskFilter] = useState<"ALL" | "HIGH_ONLY">("ALL");

  // Compute the top high risk cases by risk score. We consider cases with
  // riskScore >= 60 (medium threshold) as high risk, then sort descending and
  // pick the top 3. These will be displayed in the AI agent card. If the
  // case contains agentRecommendation, include it; otherwise placeholder.
  const topHighRiskCases = useMemo(() => {
    const candidates = cases
      .filter((c) => Number(c.riskScore ?? 0) >= 60)
      .sort((a, b) => Number(b.riskScore) - Number(a.riskScore));
    return candidates.slice(0, 3);
  }, [cases]);

  const token = localStorage.getItem("authToken");

  // ---------- DATA LOAD ----------
  useEffect(() => {
    const fetchData = async () => {
  try {
    setLoading(true);
    setError(null);

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const [summaryRes, listRes] = await Promise.all([
      fetch(`${ADMIN_API}/cases/tracking-summary`, {
        headers,
      }),
      fetch(`${ADMIN_API}/cases/tracking-list?limit=50`, {
        headers,
      }),
    ]);

    if (!summaryRes.ok) {
      const text = await summaryRes.text().catch(() => "");
      throw new Error(
        `Failed to load case summary (${summaryRes.status}): ${
          text || summaryRes.statusText
        }`
      );
    }

    if (!listRes.ok) {
      const text = await listRes.text().catch(() => "");
      throw new Error(
        `Failed to load case list (${listRes.status}): ${
          text || listRes.statusText
        }`
      );
    }

    const summaryJson = await summaryRes.json();
    const listJson = await listRes.json();

    setSummary({
      totalCases: summaryJson.totalCases ?? 0,
      highRiskCount: summaryJson.highRiskCount ?? 0,
      needsFollowUpCount: summaryJson.needsFollowUpCount ?? 0,
      byStage: summaryJson.byStage ?? {},
      updatedAt: summaryJson.updatedAt ?? null,
    });

    setCases(listJson.cases ?? []);
  } catch (err: any) {
    console.error("CASE TRACKING LOAD ERROR:", err);
    setError(err.message || "Unable to load case tracking data.");
  } finally {
    setLoading(false);
  }
};


    fetchData();
  }, [token]);

  // ---------- FILTERED VIEW ----------
  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      if (stageFilter !== "ALL" && c.stage !== stageFilter) return false;

      if (riskFilter === "HIGH_ONLY" && c.riskScore < 70) return false;

      if (!search.trim()) return true;

      const q = search.toLowerCase();
      return (
        c.caseId.toLowerCase().includes(q) ||
        c.patientName.toLowerCase().includes(q) ||
        c.doctorName.toLowerCase().includes(q) ||
        c.type.toLowerCase().includes(q)
      );
    });
  }, [cases, stageFilter, riskFilter, search]);

  // ---------- MUTATIONS ----------
  const updateCaseStage = async (caseId: number, newStage: CaseStage) => {
    try {
      if (!token) return;
      setUpdatingCaseId(caseId);
      setError(null);

      const res = await fetch(`${ADMIN_API}/cases/${caseId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ stage: newStage }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to update case stage");
      }

      const updated = await res.json();

      setCases((prev) =>
        prev.map((c) =>
          c.id === caseId
            ? {
                ...c,
                stage: updated.case?.stage ?? newStage,
                lastUpdated: updated.case?.lastUpdated ?? c.lastUpdated,
              }
            : c
        )
      );
    } catch (err: any) {
      console.error("UPDATE CASE STAGE ERROR:", err);
      setError(err.message || "Unable to update case stage.");
    } finally {
      setUpdatingCaseId(null);
    }
  };

  const toggleHighRiskFilter = () => {
    setRiskFilter((prev) => (prev === "ALL" ? "HIGH_ONLY" : "ALL"));
  };

  // ---------- RENDER HELPERS ----------
  const formatDate = (value: string | null | undefined) => {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const riskBadgeClass = (score: number) => {
    if (score >= 80) {
      return "bg-rose-500/10 text-rose-700 dark:text-rose-200 border border-rose-500/30";
    }
    if (score >= 60) {
      return "bg-amber-500/10 text-amber-700 dark:text-amber-200 border border-amber-500/30";
    }
    return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-200 border border-emerald-500/30";
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
        return "bg-slate-800 text-slate-50";
    }
  };

  const priorityDotClass = (priority: CasePriority) => {
    switch (priority) {
      case "HIGH":
        return "bg-rose-500";
      case "MEDIUM":
        return "bg-amber-500";
      case "LOW":
        return "bg-emerald-500";
    }
  };

  // ---------- UI ----------
  return (
    <>
      <section className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 px-3 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              <ActivityIcon size={14} />
              <span>Case tracking</span>
            </div>
            <h1 className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-50">
              Pipeline & risk overview
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300 max-w-xl">
              Track every active case, see where it is in the pipeline, and let
              the AI case agent surface risks and follow-ups that can&apos;t
              wait.
            </p>
          </div>

          {/* Right top – quick filters */}
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
              onClick={toggleHighRiskFilter}
              className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 font-semibold ${
                riskFilter === "HIGH_ONLY"
                  ? "bg-rose-500 text-white"
                  : "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950"
              }`}
            >
              <AlertTriangleIcon size={14} />
              <span>
                {riskFilter === "HIGH_ONLY"
                  ? "Showing high-risk only"
                  : "Highlight high-risk"}
              </span>
            </button>
          </div>
        </div>

        {/* Summary + AI card row */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr,1fr] gap-4">
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-900 bg-white/90 dark:bg-slate-950/90 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Active cases
                </span>
                <ClipboardListIcon
                  size={14}
                  className="text-violet-500 dark:text-violet-300"
                />
              </div>
              <p className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
                {summary?.totalCases ?? "—"}
              </p>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                New: {summary?.byStage?.NEW ?? 0} • In treatment:{" "}
                {summary?.byStage?.IN_TREATMENT ?? 0}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-900 bg-white/90 dark:bg-slate-950/90 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  High-risk cases
                </span>
                <AlertTriangleIcon
                  size={14}
                  className="text-rose-500 dark:text-rose-300"
                />
              </div>
              <p className="text-2xl font-semibold text-rose-600 dark:text-rose-300">
                {summary?.highRiskCount ?? "—"}
              </p>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                Based on AI risk scoring.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-900 bg-white/90 dark:bg-slate-950/90 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Needs follow-up today
                </span>
                <ClockIcon
                  size={14}
                  className="text-amber-500 dark:text-amber-300"
                />
              </div>
              <p className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
                {summary?.needsFollowUpCount ?? "—"}
              </p>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                Next-review date is today or overdue.
              </p>
            </div>
          </div>

          {/* AI case agent card */}
          <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-slate-950 via-slate-950 to-emerald-900/60 text-emerald-50 px-4 py-4 shadow-[0_20px_60px_rgba(16,185,129,0.25)]">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/50 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-100">
                  <ZapIcon size={13} />
                  <span>Case tracking agent</span>
                </div>
                {/* Headline */}
                <p className="mt-2 text-sm font-semibold">
                  AI insights on high‑risk cases
                </p>
                {/* Content: if topHighRiskCases exist, list them; else show placeholder */}
                {topHighRiskCases.length > 0 ? (
                  <ul className="mt-2 space-y-1 text-xs">
                    {topHighRiskCases.map((c) => (
                      <li key={c.id} className="flex items-start gap-2">
                        <div className="flex-shrink-0 mt-[2px] h-2 w-2 rounded-full bg-emerald-400" />
                        <div className="flex-1">
                          <span className="font-medium">{c.caseId}</span>
                          <span className="ml-1 opacity-80">({c.patientName})</span>
                          <span className="ml-1 text-emerald-300 font-semibold">{Math.round(c.riskScore)}% risk</span>
                          {c.agentRecommendation ? (
                            <span className="ml-1 text-emerald-200 italic"> – {c.agentRecommendation}</span>
                          ) : (
                            <span className="ml-1 text-emerald-200 italic"> – Summary pending…</span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-xs text-emerald-100/80">
                    No high‑risk cases flagged. Your pipeline is healthy.
                  </p>
                )}
              </div>
            </div>
            {summary?.updatedAt && (
              <p className="mt-3 text-[11px] text-emerald-100/70">
                Last refreshed: {formatDate(summary.updatedAt)}
              </p>
            )}
          </div>
        </div>

        {/* Search + stage chips */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs">
          <div className="relative w-full md:max-w-xs">
            <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 dark:text-slate-500">
              <SearchIcon size={14} />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by patient, doctor, or case ID"
              className="w-full rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 pl-8 pr-3 py-2 text-sm text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-900/5 dark:focus:ring-white/10"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {(
              [
                "ALL",
                "NEW",
                "IN_TREATMENT",
                "WAITING_ON_PATIENT",
                "READY_TO_CLOSE",
                "BLOCKED",
                "CLOSED",
              ] as const
            ).map((stage) => (
              <button
                key={stage}
                type="button"
                onClick={() =>
                  setStageFilter(stage === "ALL" ? "ALL" : (stage as CaseStage))
                }
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] border ${
                  stageFilter === stage ||
                  (stage === "ALL" && stageFilter === "ALL")
                    ? "bg-slate-900 text-slate-50 dark:bg-slate-100 dark:text-slate-950 border-slate-900 dark:border-slate-200"
                    : "bg-white/80 dark:bg-slate-950/80 border-slate-200/80 dark:border-slate-800/80 text-slate-600 dark:text-slate-300"
                }`}
              >
                <span>
                  {stage === "ALL" ? "All" : stageLabel[stage as CaseStage]}
                </span>
                {stage !== "ALL" &&
                  summary?.byStage?.[stage as CaseStage] != null && (
                    <span className="ml-0.5 text-[10px] opacity-70">
                      {summary.byStage[stage as CaseStage]}
                    </span>
                  )}
              </button>
            ))}
          </div>
        </div>

        {/* Error & loading */}
        {error && (
          <div className="rounded-2xl border border-rose-500/40 bg-rose-500/5 text-rose-700 dark:text-rose-200 text-xs px-3 py-2">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-900 bg-white/90 dark:bg-slate-950/90 p-6 text-sm text-slate-500 dark:text-slate-400">
            Loading case tracking data…
          </div>
        ) : filteredCases.length === 0 ? (
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-900 bg-white/90 dark:bg-slate-950/90 p-6 text-sm text-slate-500 dark:text-slate-400">
            No cases match the current filters.
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-900 bg-white/90 dark:bg-slate-950/90 shadow-sm overflow-hidden">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-50/90 dark:bg-slate-900/90 border-b border-slate-200/80 dark:border-slate-800/80">
                <tr className="text-left text-slate-500 dark:text-slate-400">
                  <th className="px-4 py-2 font-semibold">Case</th>
                  <th className="px-4 py-2 font-semibold">Patient</th>
                  <th className="px-4 py-2 font-semibold">Doctor</th>
                  <th className="px-4 py-2 font-semibold">Stage</th>
                  <th className="px-4 py-2 font-semibold">Priority</th>
                  <th className="px-4 py-2 font-semibold">Risk</th>
                  <th className="px-4 py-2 font-semibold">Next action</th>
                  <th className="px-4 py-2 font-semibold">Next review</th>
                </tr>
              </thead>
              <tbody>
                {filteredCases.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-slate-100/80 dark:border-slate-900/80 last:border-b-0 hover:bg-slate-50/80 dark:hover:bg-slate-900/80 align-top"
                  >
                    {/* Case ID + type */}
                    <td className="px-4 py-3 text-slate-800 dark:text-slate-100">
                      <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                        {c.caseId}
                      </div>
                      <div className="mt-0.5 text-xs font-semibold">
                        {c.type}
                      </div>
                      <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                        Updated {formatDate(c.lastUpdated)}
                      </div>
                    </td>

                    {/* Patient */}
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                      <div className="flex items-center gap-1.5">
                        <UserIcon
                          size={12}
                          className="text-slate-400 dark:text-slate-500"
                        />
                        <span className="text-xs font-medium">
                          {c.patientName}
                        </span>
                      </div>
                      {c.patientUid && (
                        <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                          ID: {c.patientUid}
                        </div>
                      )}
                    </td>

                    {/* Doctor */}
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                      <div className="text-xs font-medium">{c.doctorName}</div>
                      {c.doctorUid && (
                        <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                          ID: {c.doctorUid}
                        </div>
                      )}
                    </td>

                    {/* Stage */}
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                      <select
                        className={`text-[11px] rounded-full px-2 py-1 pr-5 outline-none border ${stagePillClass(
                          c.stage
                        )}`}
                        value={c.stage}
                        onChange={(e) =>
                          updateCaseStage(c.id, e.target.value as CaseStage)
                        }
                        disabled={updatingCaseId === c.id}
                      >
                        {(
                          [
                            "NEW",
                            "IN_TREATMENT",
                            "WAITING_ON_PATIENT",
                            "READY_TO_CLOSE",
                            "BLOCKED",
                            "CLOSED",
                          ] as CaseStage[]
                        ).map((s) => (
                          <option key={s} value={s}>
                            {stageLabel[s]}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Priority */}
                    <td className="px-4 py-3">
                      <div className="inline-flex items-center gap-1 text-[11px] text-slate-700 dark:text-slate-200">
                        <span
                          className={`h-2 w-2 rounded-full ${priorityDotClass(
                            c.priority
                          )}`}
                        />
                        <span>{priorityLabel[c.priority]}</span>
                      </div>
                    </td>

                    {/* Risk */}
                    <td className="px-4 py-3">
                      <div
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] ${riskBadgeClass(
                          c.riskScore
                        )}`}
                      >
                        <span>{Math.round(c.riskScore)}%</span>
                        {c.riskScore >= 60 && (
                          <AlertTriangleIcon size={11} />
                        )}
                      </div>
                    </td>

                    {/* Next action + AI note */}
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200 max-w-xs">
                      <div className="text-xs">
                        {c.nextAction || (
                          <span className="text-slate-400 dark:text-slate-500">
                            No next step logged
                          </span>
                        )}
                      </div>
                      {c.agentRecommendation && (
                        <div className="mt-1 text-[11px] text-emerald-700 dark:text-emerald-300">
                          <span className="font-semibold">Agent:</span>{" "}
                          {c.agentRecommendation}
                        </div>
                      )}
                    </td>

                    {/* Next review */}
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                      <div className="flex items-center gap-1 text-xs">
                        <ClockIcon
                          size={12}
                          className="text-slate-400 dark:text-slate-500"
                        />
                        <span>{formatDate(c.nextReviewDate)}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
};
