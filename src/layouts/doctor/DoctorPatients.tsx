// src/pages/doctor/DoctorPatients.tsx
import React, { useEffect, useState } from 'react';
import { UsersIcon, AlertCircleIcon } from 'lucide-react';
import { DoctorLayout } from '../../layouts/doctor/DoctorLayout';

type DoctorPatient = {
  id: string;
  name: string;
  lastVisit: string | null;
  activeCases: number;
};

const API_BASE_URL =
  (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:4000';

const getAuthToken = () =>
  localStorage.getItem('authToken') ||
  localStorage.getItem('token') ||
  '';

export const DoctorPatients: React.FC = () => {
  const [patients, setPatients] = useState<DoctorPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setError('Not authenticated. Please login again.');
      setLoading(false);
      return;
    }

    const fetchPatients = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`${API_BASE_URL}/api/doctor/patients`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message || 'Failed to load patients');
        }

        const data = await res.json();
        setPatients(data.items || []);
      } catch (err: any) {
        console.error('Doctor patients error:', err);
        setError(err.message || 'Unable to load patients');
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  return (
    <DoctorLayout>
      <section className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <UsersIcon size={18} className="text-violet-300" />
          <h1 className="text-lg font-semibold text-slate-50">Patients</h1>
        </div>
        <p className="text-sm text-slate-400">
          Lightweight list of patients you are currently seeing, pulled directly
          from your appointments and cases.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-950/90 backdrop-blur px-4 py-4">
        {loading ? (
          <div className="py-6 text-center text-xs text-slate-400">
            Loading patients…
          </div>
        ) : error ? (
          <div className="flex items-start gap-2 rounded-2xl border border-amber-500/40 bg-amber-500/5 px-3 py-3 text-xs text-amber-100">
            <AlertCircleIcon size={14} className="mt-0.5" />
            <div>
              <p className="font-semibold">Couldn&apos;t load patients</p>
              <p className="mt-0.5 text-[11px] opacity-90">{error}</p>
            </div>
          </div>
        ) : patients.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">
            No patients found for your recent appointments.
          </div>
        ) : (
          <div className="overflow-x-auto text-xs">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="text-left text-[11px] text-slate-400 border-b border-slate-800">
                  <th className="py-2 pr-4 font-medium">Name</th>
                  <th className="py-2 pr-4 font-medium">Last visit</th>
                  <th className="py-2 pr-4 font-medium">Active cases</th>
                  <th className="py-2 pr-2 font-medium text-right">ID</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-slate-900 last:border-b-0 hover:bg-slate-900/70 transition"
                  >
                    <td className="py-2 pr-4 align-top text-slate-50">
                      {p.name}
                    </td>
                    <td className="py-2 pr-4 align-top text-slate-300">
                      {p.lastVisit || '—'}
                    </td>
                    <td className="py-2 pr-4 align-top text-slate-300">
                      {p.activeCases}
                    </td>
                    <td className="py-2 pr-2 align-top text-right text-slate-500 font-mono">
                      {p.id}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </DoctorLayout>
  );
};
