// src/layouts/admin/AdminRevenue.tsx
import React, { useEffect, useState } from "react";

import {
  LineChart as LineChartIcon,
  ArrowUpRight as ArrowUpRightIcon,
  ArrowDownRight as ArrowDownRightIcon,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
const ADMIN_API = `${API_BASE}/api/admin`;

function getAuthHeaders() {
  const token = localStorage.getItem("authToken");
  return token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" };
}

type RevenueDashboard = {
  thisMonthTotal: number;
  pendingOverdue: number;
  avgPerDay: number;
  growthPercent: number | null;
  last6Months: { label: string; value: number }[];
};

export const AdminRevenue: React.FC = () => {
  const [data, setData] = useState<RevenueDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRevenue = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${ADMIN_API}/revenue-dashboard`, {
          headers: getAuthHeaders(),
        });
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("AdminRevenue error:", err);
        setError("Failed to load revenue data.");
      } finally {
        setLoading(false);
      }
    };
    fetchRevenue();
  }, []);

  return (
    <>
      <section className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 px-3 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              <LineChartIcon size={14} />
              <span>Revenue</span>
            </div>
            <h1 className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-50">
              Revenue & performance
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Track monthly revenue, compare trends, and understand cashflow at a glance.
            </p>
          </div>
        </div>

        {error && (
          <p className="text-xs text-rose-500 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
            {error}
          </p>
        )}

        {/* Key metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-900 bg-white/90 dark:bg-slate-950/90 p-4 shadow-sm">
            <p className="text-slate-500 dark:text-slate-400">This month</p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
                {data ? `₹${data.thisMonthTotal.toLocaleString()}` : "—"}
              </span>
              {data && data.growthPercent != null && (
                <span
                  className={`inline-flex items-center gap-1 text-xs ${
                    data.growthPercent >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {data.growthPercent >= 0 ? (
                    <ArrowUpRightIcon size={14} />
                  ) : (
                    <ArrowDownRightIcon size={14} />
                  )}
                  {data.growthPercent.toFixed(1)}%
                </span>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-900 bg-white/90 dark:bg-slate-950/90 p-4 shadow-sm">
            <p className="text-slate-500 dark:text-slate-400">
              Pending / overdue
            </p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
                {data ? `₹${data.pendingOverdue.toLocaleString()}` : "—"}
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400">
                <ArrowDownRightIcon size={14} />
                Needs attention
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-900 bg-white/90 dark:bg-slate-950/90 p-4 shadow-sm">
            <p className="text-slate-500 dark:text-slate-400">
              Avg. revenue / day
            </p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
                {data ? `₹${Math.round(data.avgPerDay).toLocaleString()}` : "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Simple bar visualization */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-900 bg-white/90 dark:bg-slate-950/90 p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-3">
            Last 6 months
          </p>
          <div className="h-40 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/90 dark:bg-slate-900/80 flex items-end gap-2 px-4 pb-3">
            {loading || !data
              ? [...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center gap-1 animate-pulse"
                  >
                    <div className="w-7 rounded-full bg-slate-300/70 dark:bg-slate-700/80 h-1/2" />
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                      —
                    </span>
                  </div>
                ))
              : data.last6Months.map((m, i) => (
                  <div key={m.label + i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-7 rounded-full bg-gradient-to-t from-slate-300/70 via-sky-400/80 to-emerald-400/90 dark:from-slate-700/80 dark:via-sky-500/85 dark:to-emerald-400/95"
                      style={{
                        height: `${
                          Math.min(
                            100,
                            (m.value / (data.thisMonthTotal || 1 || 1)) * 80 +
                              20
                          )
                        }%`,
                      }}
                    />
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      {m.label.substring(5)}
                    </span>
                  </div>
                ))}
          </div>
        </div>
      </section>
   </>
  );
};
