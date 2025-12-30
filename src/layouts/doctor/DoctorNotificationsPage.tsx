import React, { useEffect, useMemo, useState } from "react";
import { BellIcon, CheckIcon, Loader2Icon, RefreshCwIcon } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

function authHeaders() {
  const token = localStorage.getItem("authToken");
  return token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" };
}

type Notif = {
  id: number;
  channel?: string | null;
  type?: string | null;
  title?: string | null;
  message: string;
  status: string;
  created_at?: string | null;
  scheduled_at?: string | null;
};

export const DoctorNotificationsPage: React.FC = () => {
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"unread" | "all">("unread");
  const [err, setErr] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (tab === "all") return items;
    return items.filter((n) => String(n.status).toUpperCase() !== "READ");
  }, [items, tab]);

  async function load() {
    try {
      setLoading(true);
      setErr(null);
      const res = await fetch(`${API_BASE}/api/notifications?includeRead=1`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      setItems(data.items || []);
    } catch (e: any) {
      setErr(e?.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }

  async function markRead(id: number) {
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, status: "READ" } : n))
    );
    await fetch(`${API_BASE}/api/notifications/${id}/read`, {
      method: "POST",
      headers: authHeaders(),
    }).catch(() => {});
  }

  async function readAll() {
    setItems((prev) => prev.map((n) => ({ ...n, status: "READ" })));
    await fetch(`${API_BASE}/api/notifications/read-all`, {
      method: "POST",
      headers: authHeaders(),
    }).catch(() => {});
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 px-3 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
            <BellIcon size={14} />
            <span>Doctor notifications</span>
          </div>
          <h1 className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-50">
            Schedule & patient updates
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Appointment reminders, delay/no-show alerts, and case updates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setTab("unread")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${
              tab === "unread"
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950 border-transparent"
                : "bg-white/80 dark:bg-slate-950/80 border-slate-200/80 dark:border-slate-800/80 text-slate-700 dark:text-slate-200"
            }`}
          >
            Unread
          </button>
          <button
            onClick={() => setTab("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${
              tab === "all"
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950 border-transparent"
                : "bg-white/80 dark:bg-slate-950/80 border-slate-200/80 dark:border-slate-800/80 text-slate-700 dark:text-slate-200"
            }`}
          >
            All
          </button>

          <button
            onClick={load}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 text-slate-700 dark:text-slate-200"
          >
            <RefreshCwIcon size={14} />
            Refresh
          </button>

          <button
            onClick={readAll}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
          >
            <CheckIcon size={14} />
            Read all
          </button>
        </div>
      </div>

      {err && (
        <p className="text-xs text-rose-500 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2 dark:bg-rose-950/40 dark:border-rose-900/60">
          {err}
        </p>
      )}

      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-900 bg-white/90 dark:bg-slate-950/90 shadow-sm overflow-hidden">
        {loading ? (
          <div className="px-4 py-6 text-slate-400 text-sm flex items-center gap-2">
            <Loader2Icon className="animate-spin" size={16} /> Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-6 text-slate-400 text-sm">
            No notifications.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100/80 dark:divide-slate-900/80">
            {filtered.map((n) => (
              <li
                key={n.id}
                className="px-4 py-3 hover:bg-slate-50/80 dark:hover:bg-slate-900/80"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-50">
                      {n.title || n.type || "Notification"}
                    </div>
                    <div className="mt-1 text-sm text-slate-700 dark:text-slate-200">
                      {n.message}
                    </div>
                    <div className="mt-2 text-[11px] text-slate-400">
                      {n.created_at || ""}
                      {n.scheduled_at && (
                        <>
                          <span className="mx-2">•</span>
                          Scheduled:{" "}
                          <span className="font-mono">
                            {n.scheduled_at}
                          </span>
                        </>
                      )}
                      <span className="mx-2">•</span>
                      <span className="font-mono">
                        {String(n.status).toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {String(n.status).toUpperCase() !== "READ" && (
                    <button
                      onClick={() => markRead(n.id)}
                      className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 text-slate-700 dark:text-slate-200"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};
