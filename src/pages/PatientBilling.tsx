// src/pages/PatientBilling.tsx
import React, { useEffect, useState } from "react";
import {
  CreditCardIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  DownloadIcon,
} from "lucide-react";
import { PatientLayout } from "../layouts/patient/PatientLayout";

type Payment = {
  id: number | string;
  date: string | null;
  description: string;
  amount: number;
  status: string;
  currency?: string;
};

type DashboardResponse = {
  payments?: Payment[];
};

type LoadState = "idle" | "loading" | "ready" | "error";

// Backend base URL:
// - Set VITE_API_BASE_URL in your .env if you deploy elsewhere
// - Fallback is your Node server at http://localhost:4000
const rawBase =
  (import.meta as any).env?.VITE_API_BASE_URL &&
  String((import.meta as any).env.VITE_API_BASE_URL).trim();

const API_ROOT = (rawBase || "http://localhost:4000").replace(/\/+$/, "");

export const PatientBilling: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [status, setStatus] = useState<LoadState>("loading");

  useEffect(() => {
    const controller = new AbortController();

    const fetchBilling = async () => {
      try {
        setStatus("loading");
        const token = localStorage.getItem("authToken");

        const res = await fetch(`${API_ROOT}/api/patient/dashboard`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          signal: controller.signal,
        });

        if (!res.ok) {
          console.error("Patient billing HTTP error:", res.status);
          setStatus("error");
          return;
        }

        const contentType = res.headers.get("content-type") || "";
        const rawText = await res.text();

        if (!contentType.includes("application/json")) {
          // This would happen if you accidentally hit the frontend dev server again.
          console.error(
            "Patient billing: non-JSON response (first 80 chars):",
            rawText.slice(0, 80).replace(/\s+/g, " ")
          );
          setStatus("error");
          return;
        }

        let data: DashboardResponse;
        try {
          data = JSON.parse(rawText);
        } catch (parseErr) {
          console.error("Patient billing: failed to parse JSON:", parseErr);
          setStatus("error");
          return;
        }

        setPayments(Array.isArray(data.payments) ? data.payments : []);
        setStatus("ready");
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error("Patient billing: network or fetch error:", err);
        setStatus("error");
      }
    };

    fetchBilling();
    return () => controller.abort();
  }, []);

  const currencyLabel =
    payments[0]?.currency === "INR" || !payments[0]?.currency
      ? "₹"
      : payments[0]?.currency + " ";

  const totalDue = payments
    .filter((p) => p.status && p.status.toUpperCase() !== "PAID")
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const pendingCount = payments.filter(
    (p) => p.status && p.status.toUpperCase() !== "PAID"
  ).length;

  return (
    <PatientLayout>
      {/* HEADER */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <CreditCardIcon size={18} className="text-amber-300" />
          <h1 className="text-lg font-semibold text-slate-50">
            Payments & invoices
          </h1>
        </div>
        <p className="text-xs text-slate-400 max-w-xl">
          Review past and upcoming charges. To pay or update billing details,
          please contact your clinic&apos;s front desk. This view is read-only
          and shows billing data from your clinic&apos;s system.
        </p>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-[0.9fr,1.1fr] gap-5">
        {/* SUMMARY CARD */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-[0_18px_55px_-40px_rgba(15,23,42,0.6)]">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 tracking-[0.16em] uppercase">
              Billing overview
            </p>
            <h2 className="mt-2 text-sm font-semibold text-slate-50">
              Current balance
            </h2>

            <p className="mt-1 text-2xl font-semibold text-amber-200">
              {currencyLabel}
              {Number(totalDue || 0).toLocaleString("en-IN")}
            </p>

            <p className="mt-1 text-[11px] text-slate-400">
              This is the total of all invoices that are{" "}
              <span className="font-semibold text-slate-200">not marked as</span>{" "}
              Paid in your clinic&apos;s system.
            </p>

            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-[11px] text-slate-300">
              <CreditCardIcon size={12} className="text-amber-300" />
              <span>
                Pending invoices:{" "}
                <span className="font-semibold text-amber-200">
                  {status === "ready" ? pendingCount : "—"}
                </span>
              </span>
            </div>
          </div>

          <div className="mt-4 text-[11px] text-slate-400 border-t border-slate-800 pt-3">
            For payment links, EMIs, insurance clarifications, or corrections,
            please reach out to your clinic&apos;s billing/front-desk team.
            Online payments are not processed inside Dental Clinic AI.
          </div>
        </div>

        {/* TABLE CARD */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-[0_18px_55px_-40px_rgba(15,23,42,0.6)]">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[11px] text-slate-400 uppercase tracking-[0.14em]">
              Invoice history
            </p>
          </div>

          {/* LOADING STATE */}
          {status === "loading" && (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-10 rounded-lg bg-slate-900/80 border border-slate-800 animate-pulse"
                />
              ))}
            </div>
          )}

          {/* ERROR STATE */}
          {status === "error" && (
            <p className="text-xs text-amber-400">
              Couldn&apos;t load billing information. Please refresh later or
              contact your clinic.
            </p>
          )}

          {/* READY STATE */}
          {status === "ready" && (
            <>
              {payments.length === 0 ? (
                <p className="text-xs text-slate-400">
                  No invoices available yet. Your clinic may add invoices here
                  after your first visit or treatment.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-separate border-spacing-y-2">
                    <thead>
                      <tr className="text-[11px] uppercase tracking-[0.14em] text-slate-500">
                        <th className="px-3 py-1.5">Invoice</th>
                        <th className="px-3 py-1.5">Date</th>
                        <th className="px-3 py-1.5">Description</th>
                        <th className="px-3 py-1.5">Amount</th>
                        <th className="px-3 py-1.5">Status</th>
                        <th className="px-3 py-1.5 text-right">Download</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((p) => {
                        const rawStatus = (p.status || "").toUpperCase();
                        const isPaid = rawStatus === "PAID";
                        const isOverdue = rawStatus === "OVERDUE";
                        const statusLabel = isPaid
                          ? "Paid"
                          : isOverdue
                          ? "Overdue"
                          : p.status || "Pending";

                        const amountNum = Number(p.amount || 0);

                        const statusClasses = isPaid
                          ? "bg-emerald-500/10 text-emerald-200 border border-emerald-500/40"
                          : isOverdue
                          ? "bg-rose-500/10 text-rose-200 border border-rose-500/40"
                          : "bg-amber-500/10 text-amber-200 border border-amber-500/40";

                        return (
                          <tr key={p.id}>
                            <td className="align-top px-3 py-1.5 text-slate-200 font-medium">
                              {typeof p.id === "string"
                                ? p.id
                                : `INV-${p.id}`}
                            </td>
                            <td className="align-top px-3 py-1.5 text-slate-400 whitespace-nowrap">
                              {p.date || "—"}
                            </td>
                            <td className="align-top px-3 py-1.5 text-slate-300">
                              {p.description || "Dental treatment invoice"}
                            </td>
                            <td className="align-top px-3 py-1.5 text-amber-200 font-semibold whitespace-nowrap">
                              {currencyLabel}
                              {amountNum.toLocaleString("en-IN")}
                            </td>
                            <td className="align-top px-3 py-1.5">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusClasses}`}
                              >
                                {isPaid ? (
                                  <CheckCircle2Icon
                                    size={11}
                                    className="mr-1"
                                  />
                                ) : (
                                  <AlertCircleIcon
                                    size={11}
                                    className="mr-1"
                                  />
                                )}
                                {statusLabel}
                              </span>
                            </td>
                            <td className="align-top px-3 py-1.5 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  // Read-only: PDFs handled by clinic
                                  console.log(
                                    "PDF download is handled by the clinic; no in-app link.",
                                    p.id
                                  );
                                }}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-slate-700 text-[11px] text-slate-200 hover:bg-slate-800/80 transition disabled:opacity-60"
                              >
                                <DownloadIcon size={12} />
                                PDF
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </PatientLayout>
  );
};
