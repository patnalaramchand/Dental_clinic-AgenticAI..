// src/layouts/doctor/DoctorCases.tsx
import React, { useEffect, useState } from 'react';
import {
  ClipboardListIcon,
  FilterIcon,
  SearchIcon,
  UserIcon,
  ActivityIcon,
  XIcon,
  PlusIcon,
  AlertCircleIcon,
} from 'lucide-react';
import { DoctorLayout } from './DoctorLayout';

type CaseStage = 'New' | 'In treatment' | 'Waiting on patient' | 'Completed';

export type DoctorCase = {
  id: string;
  patientName: string;
  toothRegion: string;
  diagnosis: string;
  stage: CaseStage;
  createdAt: string;
  updatedAt: string;
};

const API_BASE_URL =
  (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:4000';

const getAuthToken = () =>
  localStorage.getItem('authToken') ||
  localStorage.getItem('token') ||
  '';

const mapStageDbToLabel = (stageDb: string | null | undefined): CaseStage => {
  const s = String(stageDb || '').toUpperCase();
  if (s === 'IN_TREATMENT') return 'In treatment';
  if (s === 'WAITING_ON_PATIENT') return 'Waiting on patient';
  if (s === 'CLOSED' || s === 'COMPLETED') return 'Completed';
  return 'New';
};

const mapStageLabelToDb = (stage: CaseStage): string => {
  switch (stage) {
    case 'In treatment':
      return 'IN_TREATMENT';
    case 'Waiting on patient':
      return 'WAITING_ON_PATIENT';
    case 'Completed':
      return 'CLOSED';
    case 'New':
    default:
      return 'NEW';
  }
};

const stageBadgeClasses = (stage: CaseStage) => {
  switch (stage) {
    case 'New':
      return 'bg-sky-500/10 text-sky-200 border border-sky-500/30';
    case 'In treatment':
      return 'bg-emerald-500/10 text-emerald-200 border border-emerald-500/30';
    case 'Waiting on patient':
      return 'bg-amber-500/10 text-amber-200 border border-amber-500/30';
    case 'Completed':
      return 'bg-slate-900 text-slate-50 border border-slate-600';
    default:
      return '';
  }
};

export const DoctorCases: React.FC = () => {
  const doctorName = localStorage.getItem('userName') || 'Doctor';

  const [cases, setCases] = useState<DoctorCase[]>([]);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<CaseStage | 'All'>('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isNewCaseOpen, setIsNewCaseOpen] = useState(false);
  const [newCase, setNewCase] = useState({
    patientName: '',
    toothRegion: '',
    diagnosis: '',
    stage: 'New' as CaseStage,
  });
  const [submitting, setSubmitting] = useState(false);

  // Track summary request status
  const [summaryStatus, setSummaryStatus] = useState<{ id: string; success: boolean; error?: string } | null>(null);

  // Load cases from API
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setError('Not authenticated. Please login again.');
      setLoading(false);
      return;
    }

    const fetchCases = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`${API_BASE_URL}/api/doctor/cases`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message || 'Failed to load cases');
        }

        const data = await res.json();
        const items = (data.cases || []) as any[];

        const mapped: DoctorCase[] = items.map((c) => ({
          id: c.id || c.caseId || '—',
          patientName: c.patientName || 'Unknown patient',
          toothRegion: c.toothRegion || 'Not specified',
          diagnosis: c.diagnosis || c.type || 'General case',
          stage: mapStageDbToLabel(c.stage),
          createdAt: (c.createdAt || '').slice(0, 10),
          updatedAt: (c.updatedAt || c.lastUpdated || '').slice(0, 10),
        }));

        setCases(mapped);
      } catch (err: any) {
        console.error('Doctor cases error:', err);
        setError(err.message || 'Unable to load cases');
      } finally {
        setLoading(false);
      }
    };

    fetchCases();
  }, []);

  /**
   * Request the AI case tracking agent to generate a summary for the given case.
   * The server will enqueue a CaseGenerateSummary event and the Python worker
   * will asynchronously process it. We optimistically display a success
   * notification to the user once the HTTP request completes.
   */
  const requestSummary = async (caseDbId: string) => {
    const token = getAuthToken();
    if (!token) {
      setSummaryStatus({ id: caseDbId, success: false, error: 'Not authenticated. Please login.' });
      return;
    }
    try {
      setSummaryStatus(null);
      const res = await fetch(`${API_BASE_URL}/api/doctor/cases/${caseDbId}/summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || 'Unable to request summary');
      }
      setSummaryStatus({ id: caseDbId, success: true });
    } catch (err: any) {
      console.error('AI summary request failed:', err);
      setSummaryStatus({ id: caseDbId, success: false, error: err.message || 'Request failed' });
    }
  };

  const filteredCases = cases.filter((c) => {
    const matchesSearch =
      !search ||
      c.patientName.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase()) ||
      c.diagnosis.toLowerCase().includes(search.toLowerCase());

    const matchesStage = stageFilter === 'All' || c.stage === stageFilter;
    return matchesSearch && matchesStage;
  });

  const handleOpenNewCase = () => {
    setNewCase({
      patientName: '',
      toothRegion: '',
      diagnosis: '',
      stage: 'New',
    });
    setIsNewCaseOpen(true);
  };

  const handleSubmitNewCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCase.patientName.trim() || !newCase.diagnosis.trim()) return;

    const token = getAuthToken();
    if (!token) {
      alert('Not authenticated. Please login again.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const res = await fetch(`${API_BASE_URL}/api/doctor/cases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          patientName: newCase.patientName.trim(),
          toothRegion: newCase.toothRegion.trim(),
          diagnosis: newCase.diagnosis.trim(),
          stage: mapStageLabelToDb(newCase.stage),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || 'Could not create case');
      }

      const data = await res.json();
      const c = data.case;

      const created: DoctorCase = {
        id: c.id || c.caseId || '—',
        patientName: c.patientName || newCase.patientName.trim(),
        toothRegion: c.toothRegion || newCase.toothRegion.trim() || 'Not specified',
        diagnosis: c.diagnosis || newCase.diagnosis.trim(),
        stage: mapStageDbToLabel(c.stage),
        createdAt: (c.createdAt || '').slice(0, 10),
        updatedAt: (c.updatedAt || c.lastUpdated || '').slice(0, 10),
      };

      setCases((prev) => [created, ...prev]);
      setIsNewCaseOpen(false);
    } catch (err: any) {
      console.error('Create case error:', err);
      setError(err.message || 'Unable to create case');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DoctorLayout>
      <section className="space-y-4">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 px-3 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              <ClipboardListIcon size={14} />
              <span>Cases</span>
            </div>
            <h1 className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-50">
              Clinical cases
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300 max-w-xl">
              Create and track treatment cases under your care. Filter by stage,
              search by patient, and keep an overview of active work.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 px-3 py-1.5 text-slate-700 dark:text-slate-200"
            >
              <FilterIcon size={14} />
              Filters
            </button>
            <button
              type="button"
              onClick={handleOpenNewCase}
              className="inline-flex items-center gap-1 rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950 px-3 py-1.5 font-semibold shadow-sm active:translate-y-[1px]"
            >
              <PlusIcon size={14} />
              New case
            </button>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="flex items-start gap-2 rounded-2xl border border-amber-500/40 bg-amber-500/5 px-3 py-3 text-xs text-amber-100">
            <AlertCircleIcon size={14} className="mt-0.5" />
            <div>
              <p className="font-semibold">Something went wrong</p>
              <p className="mt-0.5 text-[11px] opacity-90">{error}</p>
            </div>
          </div>
        )}

        {/* Search + stage chips */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs">
          <div className="relative w-full md:max-w-md">
            <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 dark:text-slate-500">
              <SearchIcon size={14} />
            </span>
            <input
              type="text"
              placeholder="Search by patient, diagnosis, or case ID"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 pl-8 pr-3 py-2 text-sm text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-900/5 dark:focus:ring-white/10"
            />
          </div>

          <div className="flex flex-wrap gap-2 text-slate-500 dark:text-slate-400">
            {(['All', 'New', 'In treatment', 'Waiting on patient', 'Completed'] as const).map(
              (stage) => (
                <button
                  key={stage}
                  type="button"
                  onClick={() => setStageFilter(stage as CaseStage | 'All')}
                  className={[
                    'inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px]',
                    stageFilter === stage
                      ? 'border-slate-900 bg-slate-900 text-slate-50 dark:border-slate-100 dark:bg-slate-100 dark:text-slate-950'
                      : 'border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80',
                  ].join(' ')}
                >
                  {stage === 'All' ? <ActivityIcon size={12} /> : <UserIcon size={12} />}
                  <span>{stage}</span>
                </button>
              )
            )}
          </div>
        </div>

        {/* Cases list */}
        {loading ? (
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-950/70 p-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Loading your cases…
          </div>
        ) : filteredCases.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-950/70 p-6 text-center text-sm text-slate-500 dark:text-slate-400">
            No cases match your filters. Try adjusting the search or stage.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredCases.map((c) => (
              <div
                key={c.id}
                className="rounded-2xl border border-slate-200/80 dark:border-slate-900 bg-white/90 dark:bg-slate-950/90 p-4 shadow-sm hover:shadow-[0_18px_55px_-40px_rgba(15,23,42,0.45)] transition-shadow"
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    {c.id}
                  </p>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${stageBadgeClasses(
                      c.stage
                    )}`}
                  >
                    {c.stage}
                  </span>
                </div>

                <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  {c.diagnosis}
                </p>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                  {c.patientName}
                </p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Region: {c.toothRegion}
                </p>

                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>Created: {c.createdAt || '—'}</span>
                  <span>Updated: {c.updatedAt || '—'}</span>
                </div>

            {/* Summary button */}
            <div className="mt-3 flex items-center justify-end">
              <button
                type="button"
                onClick={() => requestSummary(c.id)}
                className="text-xs inline-flex items-center gap-1 px-3 py-1 rounded-full border border-emerald-500 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-500/10 disabled:opacity-60"
              >
                <span>AI summary</span>
              </button>
            </div>
            {summaryStatus && summaryStatus.id === c.id && (
              <p
                className={`mt-1 text-[10px] ${summaryStatus.success ? 'text-emerald-500' : 'text-rose-500'}`}
              >
                {summaryStatus.success
                  ? 'Summary requested. The AI agent will process it shortly.'
                  : summaryStatus.error || 'Failed to request summary.'}
              </p>
            )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* New Case Modal */}
      {isNewCaseOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 text-slate-50 shadow-[0_26px_90px_-40px_rgba(15,23,42,0.9)]">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-[0.16em]">
                  New case
                </p>
                <h2 className="text-sm font-semibold">
                  Create clinical case for {doctorName}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsNewCaseOpen(false)}
                className="h-8 w-8 rounded-xl border border-slate-800 bg-slate-900 flex items-center justify-center text-slate-400 hover:text-slate-100 hover:bg-slate-800"
              >
                <XIcon size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmitNewCase} className="px-4 py-4 space-y-3 text-xs">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-slate-300">
                  Patient name
                </label>
                <input
                  type="text"
                  value={newCase.patientName}
                  onChange={(e) =>
                    setNewCase((prev) => ({ ...prev, patientName: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-xs text-slate-50 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  placeholder="e.g., Rahul Sharma"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-slate-300">
                  Tooth / region
                </label>
                <input
                  type="text"
                  value={newCase.toothRegion}
                  onChange={(e) =>
                    setNewCase((prev) => ({ ...prev, toothRegion: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-xs text-slate-50 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  placeholder="e.g., Lower left – #36"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-slate-300">
                  Diagnosis / treatment intent
                </label>
                <textarea
                  value={newCase.diagnosis}
                  onChange={(e) =>
                    setNewCase((prev) => ({ ...prev, diagnosis: e.target.value }))
                  }
                  rows={3}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-xs text-slate-50 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  placeholder="Short description of the treatment plan"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-slate-300">
                  Stage
                </label>
                <select
                  value={newCase.stage}
                  onChange={(e) =>
                    setNewCase((prev) => ({
                      ...prev,
                      stage: e.target.value as CaseStage,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-xs text-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                >
                  <option value="New">New</option>
                  <option value="In treatment">In treatment</option>
                  <option value="Waiting on patient">Waiting on patient</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewCaseOpen(false)}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-900"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-xl bg-emerald-500 text-slate-950 px-3 py-1.5 text-xs font-semibold hover:bg-emerald-400 active:translate-y-[1px] disabled:opacity-60"
                  disabled={submitting}
                >
                  {submitting ? 'Creating…' : 'Create case'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DoctorLayout>
  );
};
