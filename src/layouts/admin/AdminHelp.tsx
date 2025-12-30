// src/layouts/admin/AdminHelp.tsx
import React from "react";

import {
  HelpCircle,
  MessageCircle,
  FileText,
  PlayCircle,
  Mail,
} from "lucide-react";
import { Link } from "react-router-dom";

export const AdminHelp: React.FC = () => {
  return (
    <>
      <section className="space-y-5">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 px-3 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              <HelpCircle size={14} />
              <span>Help & Support</span>
            </div>
            <h1 className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-50">
              Need help with Dental Clinic AI?
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Quick links for administrators to troubleshoot access, agents, and daily workflows.
            </p>
          </div>
        </header>

        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 p-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageCircle size={16} className="text-emerald-500" />
              <p className="font-semibold text-slate-900 dark:text-slate-50">
                Common admin tasks
              </p>
            </div>
            <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
              <li>• Reset a user password</li>
              <li>• Add a new doctor or patient</li>
              <li>• Check why a user cannot login</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText size={16} className="text-sky-500" />
              <p className="font-semibold text-slate-900 dark:text-slate-50">
                Documentation
              </p>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-2">
              Review how appointments, cases, inventory, and revenue dashboards are wired.
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Your workflow docs live in your internal Notion / project space – link them from here if needed.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 p-4">
            <div className="flex items-center gap-2 mb-2">
              <PlayCircle size={16} className="text-violet-500" />
              <p className="font-semibold text-slate-900 dark:text-slate-50">
                Need more help?
              </p>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-2">
              Contact your tech team or support inbox for deeper debugging.
            </p>
            <Link
              to="/help/contact"
              className="inline-flex items-center gap-1 rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950 px-3 py-1.5 text-xs font-semibold"
            >
              <Mail size={14} />
              Contact support
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};
