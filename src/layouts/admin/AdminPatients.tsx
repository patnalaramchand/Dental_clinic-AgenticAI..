import { useEffect, useMemo, useState } from "react";

type PatientRow = {
  id: string;
  full_name: string;
  email?: string | null;
  phone?: string | null;
  last_appointment?: string | null;
  appointment_count: number;
};

type NewPatientForm = {
  full_name: string;
  phone: string;
  email: string;
  dob: string;
  gender: "" | "Male" | "Female" | "Other";
  address: string;
  medical_history: string;
  portal_access: boolean;
};

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg px-3 py-1 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            Close
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function AdminPatients() {
  const [rows, setRows] = useState<PatientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const [openNew, setOpenNew] = useState(false);
  const [savingNew, setSavingNew] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [form, setForm] = useState<NewPatientForm>({
    full_name: "",
    phone: "",
    email: "",
    dob: "",
    gender: "",
    address: "",
    medical_history: "",
    portal_access: false,
  });

  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/patients", { headers: getAuthHeaders() });
      const j = await r.json();
      if (r.ok) setRows(j.patients || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((p) => {
      return (
        p.id.toLowerCase().includes(s) ||
        p.full_name.toLowerCase().includes(s) ||
        (p.email || "").toLowerCase().includes(s) ||
        (p.phone || "").toLowerCase().includes(s)
      );
    });
  }, [rows, q]);

  function resetForm() {
    setForm({
      full_name: "",
      phone: "",
      email: "",
      dob: "",
      gender: "",
      address: "",
      medical_history: "",
      portal_access: false,
    });
  }

  async function createPatient() {
    if (!form.full_name.trim()) {
      setToast("Full name is required");
      return;
    }
    if (form.portal_access && !form.email.trim()) {
      setToast("Email is required if Portal Access is enabled");
      return;
    }

    setSavingNew(true);
    try {
      const payload: any = {
        role: "PATIENT",
        full_name: form.full_name.trim(),
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        dob: form.dob || null,
        gender: form.gender || null,
        address: form.address.trim() || null,
        patient_profile: {
          medical_history: form.medical_history.trim() || null,
        },
        portal_access: !!form.portal_access,
      };

      const r = await fetch("/api/admin/users", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const j = await r.json();
      if (!r.ok) {
        setToast(j?.error || "Failed to create patient");
        return;
      }
      setToast("Patient created");
      setOpenNew(false);
      resetForm();
      await load();
    } catch (e) {
      console.error(e);
      setToast("Failed to create patient");
    } finally {
      setSavingNew(false);
    }
  }

  return (
    <div className="p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Patients</h1>
          <p className="text-sm text-gray-600">Search, view and add patients.</p>
        </div>

        <div className="flex items-center gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, phone, email, ID"
            className="w-full rounded-xl border px-4 py-2 text-sm shadow-sm outline-none focus:border-gray-900 sm:w-72"
          />
          <button
            onClick={() => setOpenNew(true)}
            className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-gray-800"
          >
            + New Patient
          </button>
        </div>
      </div>

      {toast && (
        <div className="mt-4 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 shadow-sm">
          {toast}
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="px-6 py-3 font-medium">Patient ID</th>
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Phone</th>
                <th className="px-6 py-3 font-medium">Email</th>
                <th className="px-6 py-3 font-medium">Appointments</th>
                <th className="px-6 py-3 font-medium">Last Visit</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td className="px-6 py-4" colSpan={6}>
                    Loading...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td className="px-6 py-4" colSpan={6}>
                    No patients found.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-mono text-xs text-gray-700">
                      {p.id}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {p.full_name}
                    </td>
                    <td className="px-6 py-4 text-gray-700">{p.phone || "—"}</td>
                    <td className="px-6 py-4 text-gray-700">{p.email || "—"}</td>
                    <td className="px-6 py-4 text-gray-700">{p.appointment_count}</td>
                    <td className="px-6 py-4 text-gray-700">{fmtDate(p.last_appointment)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={openNew}
        title="Create New Patient"
        onClose={() => {
          if (!savingNew) {
            setOpenNew(false);
            resetForm();
          }
        }}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-gray-700">Full name *</label>
            <input
              value={form.full_name}
              onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
              className="mt-1 w-full rounded-xl border px-4 py-2 text-sm shadow-sm outline-none focus:border-gray-900"
              placeholder="Patient full name"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Phone</label>
            <input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="mt-1 w-full rounded-xl border px-4 py-2 text-sm shadow-sm outline-none focus:border-gray-900"
              placeholder="10-digit phone"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="mt-1 w-full rounded-xl border px-4 py-2 text-sm shadow-sm outline-none focus:border-gray-900"
              placeholder="Optional (required for portal access)"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Date of birth</label>
            <input
              type="date"
              value={form.dob}
              onChange={(e) => setForm((f) => ({ ...f, dob: e.target.value }))}
              className="mt-1 w-full rounded-xl border px-4 py-2 text-sm shadow-sm outline-none focus:border-gray-900"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Gender</label>
            <select
              value={form.gender}
              onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value as any }))}
              className="mt-1 w-full rounded-xl border px-4 py-2 text-sm shadow-sm outline-none focus:border-gray-900"
            >
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-gray-700">Address</label>
            <input
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              className="mt-1 w-full rounded-xl border px-4 py-2 text-sm shadow-sm outline-none focus:border-gray-900"
              placeholder="Optional"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-gray-700">Medical history</label>
            <textarea
              value={form.medical_history}
              onChange={(e) => setForm((f) => ({ ...f, medical_history: e.target.value }))}
              className="mt-1 w-full rounded-xl border px-4 py-2 text-sm shadow-sm outline-none focus:border-gray-900"
              rows={4}
              placeholder="Allergies, chronic conditions, notes..."
            />
          </div>

          <div className="sm:col-span-2 flex items-center gap-3">
            <input
              id="portal_access"
              type="checkbox"
              checked={form.portal_access}
              onChange={(e) => setForm((f) => ({ ...f, portal_access: e.target.checked }))}
              className="h-4 w-4"
            />
            <label htmlFor="portal_access" className="text-sm text-gray-700">
              Enable Patient Portal Access (requires email). Patient can set password using
              “Forgot Password”.
            </label>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={() => {
              setOpenNew(false);
              resetForm();
            }}
            disabled={savingNew}
            className="rounded-xl border px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={createPatient}
            disabled={savingNew}
            className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-gray-800 disabled:opacity-60"
          >
            {savingNew ? "Creating..." : "Create Patient"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

// ✅ Export both ways to avoid import-mismatch errors
export { AdminPatients };
export default AdminPatients;
