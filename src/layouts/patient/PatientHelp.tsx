// src/layouts/patient/PatientHelp.tsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  MessageCircle,
  Info,
  Phone,
  Mail,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CalendarDays,
  CreditCard,
  ClipboardList,
} from "lucide-react";
import { PatientLayout } from "./PatientLayout";

type FaqItem = {
  id: string;
  question: string;
  answer: string;
  category: "appointments" | "billing" | "profile" | "general";
};

const FAQS: FaqItem[] = [
  {
    id: "how-book-appointment",
    category: "appointments",
    question: "How do I book an appointment?",
    answer:
      "Go to the Appointments page, click “Book new appointment”, choose your preferred doctor, date, and time slot, then confirm. You’ll receive an in-app confirmation and optionally an email/SMS if your clinic has that enabled.",
  },
  {
    id: "reschedule-appointment",
    category: "appointments",
    question: "Can I reschedule or cancel an appointment?",
    answer:
      "Yes. Open the Appointments page, select the upcoming appointment, and choose “Reschedule” or “Cancel”. Some clinics may restrict changes within a few hours of the scheduled time; if you don’t see the option, please call the clinic.",
  },
  {
    id: "view-treatment-history",
    category: "profile",
    question: "Where can I see my treatment history?",
    answer:
      "Open the Treatments page from the sidebar. You can see completed procedures, notes from your doctor (if shared), and upcoming planned treatments.",
  },
  {
    id: "billing-summary",
    category: "billing",
    question: "How do I view my bills and payments?",
    answer:
      "Go to the Billing page. You’ll see a list of invoices, their status (Paid, Pending, or Overdue), and any outstanding balance. You can also download receipts if your clinic has enabled that feature.",
  },
  {
    id: "update-contact-details",
    category: "profile",
    question: "How can I update my phone number or address?",
    answer:
      "Navigate to your Profile or Account settings (often under your name or avatar). From there, you can update your contact details. If something is locked, contact the clinic so they can update it for you.",
  },
  {
    id: "data-privacy",
    category: "general",
    question: "Who can see my data inside the clinic?",
    answer:
      "Only authorized clinic staff (such as your doctor and front-desk/admin team) can view your data. Access is controlled by roles, and everything is tracked in the clinic’s system for audit and compliance.",
  },
];

export const PatientHelp: React.FC = () => {
  const [activeFaqId, setActiveFaqId] = useState<string | null>(
    "how-book-appointment"
  );
  const [selectedCategory, setSelectedCategory] = useState<
    FaqItem["category"] | "all"
  >("all");

  const filteredFaqs = FAQS.filter(
    (f) => selectedCategory === "all" || f.category === selectedCategory
  );

  return (
    <PatientLayout current="help">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 mb-2">
              <MessageCircle size={14} />
              <span>Help for patients</span>
            </div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
              How can we help you today?
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-xl">
              Find quick answers about appointments, bills, and your profile.
              This help center is specific to your patient account in Dental
              Clinic AI.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:items-end">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Still stuck? Reach our clinic support team.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                to="/help/contact"
                className="inline-flex items-center rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-emerald-600"
              >
                <Mail size={14} className="mr-1" />
                Contact support
              </Link>
              <button
                type="button"
                className="inline-flex items-center rounded-xl border border-slate-300 dark:border-slate-700 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-100 hover:bg-slate-100/60 dark:hover:bg-slate-800/70"
              >
                <Phone size={14} className="mr-1" />
                Call clinic
              </button>
            </div>
          </div>
        </div>

        {/* Quick help tiles */}
        <div className="grid gap-4 md:grid-cols-3">
          <button
            type="button"
            onClick={() => setSelectedCategory("appointments")}
            className={`flex flex-col items-start rounded-2xl border px-4 py-3 text-left transition ${
              selectedCategory === "appointments"
                ? "border-emerald-500 bg-emerald-500/5"
                : "border-slate-800 bg-slate-950/40 hover:border-slate-600"
            }`}
          >
            <div className="flex items-center gap-2 text-sm font-medium text-slate-100">
              <CalendarDays size={16} />
              <span>Appointments & visits</span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Booking, rescheduling, cancellations, and reminders.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory("billing")}
            className={`flex flex-col items-start rounded-2xl border px-4 py-3 text-left transition ${
              selectedCategory === "billing"
                ? "border-emerald-500 bg-emerald-500/5"
                : "border-slate-800 bg-slate-950/40 hover:border-slate-600"
            }`}
          >
            <div className="flex items-center gap-2 text-sm font-medium text-slate-100">
              <CreditCard size={16} />
              <span>Billing & payments</span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Invoices, pending balance, and payment confirmations.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory("profile")}
            className={`flex flex-col items-start rounded-2xl border px-4 py-3 text-left transition ${
              selectedCategory === "profile"
                ? "border-emerald-500 bg-emerald-500/5"
                : "border-slate-800 bg-slate-950/40 hover:border-slate-600"
            }`}
          >
            <div className="flex items-center gap-2 text-sm font-medium text-slate-100">
              <ClipboardList size={16} />
              <span>Profile & records</span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Personal info, treatment history, and privacy.
            </p>
          </button>
        </div>

        {/* Info banner */}
        <div className="flex items-start gap-2 rounded-2xl border border-slate-800 bg-slate-950/60 px-3 py-2.5 text-xs text-slate-300">
          <AlertCircle size={14} className="mt-0.5 text-amber-400" />
          <p>
            Dental Clinic AI is a digital front-desk assistant. It helps manage
            your appointments and records, but it does{" "}
            <span className="font-semibold">not</span> replace medical advice
            from your dentist. Always follow the recommendations given directly
            by your doctor or clinic.
          </p>
        </div>

        {/* FAQ list */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60">
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
            <div className="flex items-center gap-2">
              <Info size={16} className="text-emerald-400" />
              <div>
                <p className="text-sm font-medium text-slate-100">
                  Frequently asked questions
                </p>
                <p className="text-[11px] text-slate-500">
                  Click a question to expand the answer.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("all");
                setActiveFaqId("how-book-appointment");
              }}
              className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-[11px] text-slate-200 hover:bg-slate-800"
            >
              Reset filters
            </button>
          </div>

          <div className="divide-y divide-slate-800">
            {filteredFaqs.map((faq) => {
              const isActive = activeFaqId === faq.id;
              return (
                <button
                  key={faq.id}
                  type="button"
                  onClick={() =>
                    setActiveFaqId((prev) => (prev === faq.id ? null : faq.id))
                  }
                  className="w-full text-left px-4 py-3 hover:bg-slate-900/70"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-100">
                        {faq.question}
                      </p>
                      {isActive && (
                        <p className="mt-1.5 text-xs text-slate-300">
                          {faq.answer}
                        </p>
                      )}
                    </div>
                    <div className="mt-0.5 text-slate-500">
                      {isActive ? (
                        <ChevronUp size={15} />
                      ) : (
                        <ChevronDown size={15} />
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer hint */}
        <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
          Need urgent help about pain, swelling, or an emergency? Please{" "}
          <span className="font-medium text-slate-200">
            call your clinic directly
          </span>{" "}
          rather than using the app or email.
        </div>
      </div>
    </PatientLayout>
  );
};
