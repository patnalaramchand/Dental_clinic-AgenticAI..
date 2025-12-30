// src/layouts/doctor/DoctorHelp.tsx
import React from "react";
import { DoctorLayout } from "./DoctorLayout";
import {
  HelpCircle,
  MessageCircle,
  Mail,
  BookOpen,
  LifeBuoy,
  Bug,
  ExternalLink,
  ArrowRightCircle,
  Sparkles,
} from "lucide-react";

export const DoctorHelp: React.FC = () => {
  return (
    <DoctorLayout>
      <div className="space-y-6">
        {/* HERO / HEADER */}
        <section className="relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/90 px-5 py-5 shadow-sm">
          {/* soft halo */}
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute -top-24 left-10 h-40 w-40 rounded-full bg-sky-500/15 dark:bg-sky-500/25 blur-3xl" />
            <div className="absolute bottom-0 right-0 h-40 w-40 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 blur-3xl" />
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/80 px-3 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                <HelpCircle size={14} />
                <span>Doctor help centre</span>
              </div>
              <h1 className="text-xl md:text-2xl font-semibold text-slate-900 dark:text-slate-50">
                How can we help you today, Doctor?
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-300 max-w-2xl">
                Browse quick guides, common workflows and support options for{" "}
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  appointments, cases, patients and AI assistants
                </span>{" "}
                — all tuned for the doctor console.
              </p>
            </div>

            <div className="flex flex-col gap-2 text-xs">
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-200">
                <Sparkles size={13} />
                <span>AI assistants online</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Need something urgent? Use the chat shortcut inside a case or
                appointment panel to ask the AI directly.
              </p>
            </div>
          </div>
        </section>

        {/* GRID: QUICK ACTIONS + FAQ + SYSTEM */}
        <section className="grid grid-cols-1 xl:grid-cols-[1.4fr,1.1fr] gap-4">
          {/* LEFT: Quick actions + common flows */}
          <div className="space-y-4">
            {/* Quick actions */}
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-900 bg-white/90 dark:bg-slate-950/90 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  Quick actions
                </h2>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Frequently used doctor workflows
                </span>
              </div>
              <div className="grid sm:grid-cols-2 gap-3 text-xs">
                <button className="w-full text-left rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/90 dark:bg-slate-900/80 px-3 py-2.5 hover:border-sky-500/70 hover:bg-sky-50/60 dark:hover:bg-sky-950/40 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 dark:text-slate-50">
                      Document a new case
                    </span>
                    <ArrowRightCircle size={14} className="text-slate-400" />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    Start from today&apos;s appointment or patient profile.
                  </p>
                </button>

                <button className="w-full text-left rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/90 dark:bg-slate-900/80 px-3 py-2.5 hover:border-emerald-500/70 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/40 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 dark:text-slate-50">
                      Summarise a treatment plan
                    </span>
                    <ArrowRightCircle size={14} className="text-slate-400" />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    Use the AI case assistant to generate patient-facing notes.
                  </p>
                </button>

                <button className="w-full text-left rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/90 dark:bg-slate-900/80 px-3 py-2.5 hover:border-violet-500/70 hover:bg-violet-50/60 dark:hover:bg-violet-950/40 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 dark:text-slate-50">
                      Review follow-ups
                    </span>
                    <ArrowRightCircle size={14} className="text-slate-400" />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    Filter your case list by &ldquo;Awaiting follow-up&rdquo; stage.
                  </p>
                </button>

                <button className="w-full text-left rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/90 dark:bg-slate-900/80 px-3 py-2.5 hover:border-amber-500/70 hover:bg-amber-50/60 dark:hover:bg-amber-950/40 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 dark:text-slate-50">
                      Flag a complex case
                    </span>
                    <ArrowRightCircle size={14} className="text-slate-400" />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    Tag cases as &quot;High complexity&quot; so admin can assist.
                  </p>
                </button>
              </div>
            </div>

            {/* FAQ cards */}
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-900 bg-white/90 dark:bg-slate-950/90 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen size={16} className="text-sky-500" />
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  Common questions
                </h2>
              </div>
              <div className="space-y-3 text-sm">
                <div className="rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/80 px-3 py-2.5">
                  <p className="font-medium text-slate-900 dark:text-slate-50">
                    How do I convert an appointment into a case?
                  </p>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                    Open the appointment &rarr; click{" "}
                    <span className="font-semibold">Create case</span>. The
                    system links the new case to that patient and visit, and the
                    case tracking agent will pick it up automatically.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/80 px-3 py-2.5">
                  <p className="font-medium text-slate-900 dark:text-slate-50">
                    Where can I see all cases assigned to me?
                  </p>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                    Go to{" "}
                    <span className="font-semibold">Cases &gt; My cases</span>{" "}
                    in the doctor console. You can filter by stage (New, In
                    treatment, Awaiting follow-up, Ready to close) and by
                    patient.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/80 px-3 py-2.5">
                  <p className="font-medium text-slate-900 dark:text-slate-50">
                    How does the AI summariser use my notes?
                  </p>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                    The AI only uses the structured fields and free-text notes
                    you enter inside this system to suggest drafts (treatment
                    summaries, follow-up instructions, letter templates). You
                    remain in full control to review and edit before sharing
                    with patients or admin.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Contact + system status */}
          <div className="space-y-4">
            {/* Contact support */}
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-900 bg-white/90 dark:bg-slate-950/90 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <LifeBuoy size={16} className="text-emerald-500" />
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                    Need human support?
                  </h2>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 mb-3">
                For access issues, data corrections or urgent downtime, reach
                out to your clinic admin or technical support.
              </p>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/80 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <MessageCircle size={14} className="text-sky-500" />
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-50">
                        Clinic admin team
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        For role, access and scheduling questions.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/80 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-emerald-500" />
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-50">
                        Technical support
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Example: support@dental-clinic.ai
                      </p>
                    </div>
                  </div>
                  <a
                    href="mailto:support@dental-clinic.ai"
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-sky-600 dark:text-sky-300 hover:underline"
                  >
                    Email
                    <ExternalLink size={11} />
                  </a>
                </div>
              </div>
            </div>

            {/* System status & tips */}
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-900 bg-white/90 dark:bg-slate-950/90 p-4 shadow-sm space-y-3 text-xs">
              <div className="flex items-center gap-2">
                <Bug size={14} className="text-amber-500" />
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  System tips
                </h2>
              </div>
              <ul className="space-y-2 list-disc list-inside text-slate-600 dark:text-slate-300">
                <li>
                  If a page looks blank, try a hard refresh (
                  <span className="font-mono">Ctrl + Shift + R</span>) or re-login.
                </li>
                <li>
                  When documenting sensitive details, avoid patient names in free-text
                  that you intend to share externally — use the built-in export tools.
                </li>
                <li>
                  For slow pages, check your network first. If the issue persists,
                  note the time, patient/case ID and share it with support.
                </li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </DoctorLayout>
  );
};
