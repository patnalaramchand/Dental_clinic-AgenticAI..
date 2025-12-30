// src/pages/doctor/DoctorInsights.tsx
import React from 'react';
import { ActivityIcon, CheckCircle2Icon, AlertCircleIcon } from 'lucide-react';
import { DoctorLayout } from '../../layouts/doctor/DoctorLayout';

export const DoctorInsights: React.FC = () => {
  return (
    <DoctorLayout>
      <section className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <ActivityIcon size={18} className="text-amber-300" />
          <h1 className="text-lg font-semibold text-slate-50">Signals & insights</h1>
        </div>
        <p className="text-sm text-slate-400">
          A compact summary of how your week is trending. Later this can be powered by real
          analytics from the platform.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/90 backdrop-blur px-4 py-4">
          <h2 className="text-sm font-semibold text-slate-50 mb-2">Positive signals</h2>
          <ul className="space-y-2 text-xs text-slate-300">
            <li className="flex items-start gap-2">
              <CheckCircle2Icon size={13} className="mt-0.5 text-emerald-300" />
              <span>Chair utilisation is above your 4-week average.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2Icon size={13} className="mt-0.5 text-emerald-300" />
              <span>Follow-up adherence is trending upwards for implant patients.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2Icon size={13} className="mt-0.5 text-emerald-300" />
              <span>Most morning slots are consistently filled.</span>
            </li>
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/90 backdrop-blur px-4 py-4">
          <h2 className="text-sm font-semibold text-slate-50 mb-2">Watch list</h2>
          <ul className="space-y-2 text-xs text-slate-300">
            <li className="flex items-start gap-2">
              <AlertCircleIcon size={13} className="mt-0.5 text-amber-300" />
              <span>Late afternoon slots have more cancellations than usual.</span>
            </li>
            <li className="flex items-start gap-2">
              <AlertCircleIcon size={13} className="mt-0.5 text-amber-300" />
              <span>Two implant cases are approaching their review window.</span>
            </li>
            <li className="flex items-start gap-2">
              <AlertCircleIcon size={13} className="mt-0.5 text-amber-300" />
              <span>Consider spacing long procedures with short hygiene visits.</span>
            </li>
          </ul>
        </div>
      </section>
    </DoctorLayout>
  );
};
