// src/pages/PatientTreatments.tsx
import React, { useEffect, useState } from "react";
import {
  FileTextIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CheckCircle2Icon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PatientLayout } from "../layouts/patient/PatientLayout";

type Treatment = {
  id: string;
  title: string;
  lastUpdated: string | null;
  stage: string;
  summary: string;
  details: string | null;
};

type TreatmentsResponse = {
  items: Treatment[];
  error?: boolean;
};

type LoadState = "idle" | "loading" | "ready" | "error";

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

export const PatientTreatments: React.FC = () => {
  const navigate = useNavigate();

  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [status, setStatus] = useState<LoadState>("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setStatus("loading");
        setErrorMsg(null);

        const data = await fetchWithAuth<TreatmentsResponse>(
          "/api/patient/treatments"
        );
        if (cancelled) return;

        const items = data.items ?? [];
        setTreatments(items);
        setExpandedId(items[0]?.id ?? null);
        setStatus("ready");
      } catch (err: any) {
        if (cancelled) return;
        console.error("PATIENT TREATMENTS ERROR", err);

        if (err.code === "NO_TOKEN" || err.status === 401) {
          setErrorMsg("Session expired. Please log in again.");
          setStatus("error");
          navigate("/login?role=patient");
        } else {
          setErrorMsg(err.message || "Failed to load treatments.");
          setStatus("error");
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <PatientLayout>
      <section className="flex flex-col gap-2 mb-4">
        <div className="flex items-center gap-2">
          <FileTextIcon size={18} className="text-sky-300" />
          <h1 className="text-lg font-semibold text-slate-50">
            Treatment summaries
          </h1>
        </div>
        <p className="text-xs text-slate-400 max-w-xl">
          These AI-assisted summaries are based on your clinical notes and
          reviewed by your dentist. They are read-only and for your reference.
        </p>
      </section>

      {errorMsg && (
        <div className="mb-3 rounded-xl border border-amber-500/60 bg-amber-500/10 text-xs text-amber-200 px-3 py-2">
          {errorMsg}
        </div>
      )}

      <section className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
        {status === "loading" && (
          <p className="text-xs text-slate-500">Loading summaries…</p>
        )}

        {status === "ready" && treatments.length === 0 && (
          <p className="text-xs text-slate-500">
            No treatment summaries available yet.
          </p>
        )}

        {status === "ready" &&
          treatments.map((t) => {
            const isOpen = expandedId === t.id;
            return (
              <div
                key={t.id}
                className="rounded-xl border border-slate-800 bg-slate-900/70 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setExpandedId(isOpen ? null : t.id)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-50">
                      {t.title}
                    </p>
                    <p className="text-[11px] text-sky-300 mt-0.5">
                      Stage: {t.stage}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Updated: {t.lastUpdated || "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-emerald-300">
                    <CheckCircle2Icon size={12} />
                    <span>Reviewed by dentist</span>
                    {isOpen ? (
                      <ChevronDownIcon size={16} className="text-slate-300" />
                    ) : (
                      <ChevronRightIcon size={16} className="text-slate-300" />
                    )}
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-slate-800 px-4 py-3 text-xs text-slate-300">
                    <p className="mb-2">{t.summary}</p>
                    {t.details && (
                      <pre className="whitespace-pre-wrap font-sans text-[11px] text-slate-400 leading-relaxed bg-slate-950/60 rounded-lg px-3 py-2 border border-slate-800">
                        {t.details}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            );
          })}
      </section>
    </PatientLayout>
  );
};
