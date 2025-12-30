// src/layouts/admin/AdminClinicSetup.tsx
import { useEffect, useMemo, useState } from "react";

type ClinicSettings = {
  clinic_name: string;
  address: string;
  phone: string;
  email: string;
  timezone: string;
  working_hours: any;
  treatment_types: string[];
  note_templates: any;
  ai_prefs: any;
};

type UserRow = {
  id: string;
  full_name: string;
  email?: string | null;
  phone?: string | null;
  role: string;
  is_active: number;
};

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

function api(path: string) {
  // expects path like "/api/...."
  return `${API_BASE}${path}`;
}

function getAuthHeaders() {
  // ✅ MUST match what your Login/CreateAccount stores
  const token = localStorage.getItem("authToken");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function safeJsonParse<T>(value: any, fallback: T): T {
  try {
    if (!value) return fallback;
    if (typeof value === "object") return value as T;
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

async function readJsonOrThrow(res: Response) {
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return await res.json();
  // backend returned HTML/text (often due to 404/proxy) -> show readable error
  const text = await res.text();
  throw new Error(
    `Expected JSON but got ${ct || "unknown content-type"} (HTTP ${res.status}). ` +
      `URL: ${res.url}\n` +
      text.slice(0, 180)
  );
}

const DEFAULT_WORKING_HOURS = {
  monday: [{ start: "10:00", end: "19:00" }],
  tuesday: [{ start: "10:00", end: "19:00" }],
  wednesday: [{ start: "10:00", end: "19:00" }],
  thursday: [{ start: "10:00", end: "19:00" }],
  friday: [{ start: "10:00", end: "19:00" }],
  saturday: [{ start: "10:00", end: "14:00" }],
  sunday: [],
};

export function AdminClinicSetup() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [clinicName, setClinicName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [timezone, setTimezone] = useState("Asia/Kolkata");

  const [treatmentsText, setTreatmentsText] = useState("");
  const [workingHoursText, setWorkingHoursText] = useState(
    JSON.stringify(DEFAULT_WORKING_HOURS, null, 2)
  );
  const [noteTemplatesText, setNoteTemplatesText] = useState(
    JSON.stringify(
      {
        follow_up: "Follow-up reminder: Please visit the clinic in {{days}} days.",
        no_show: "We missed you today. Reply to reschedule.",
        post_op: "Post-treatment care: {{instructions}}",
      },
      null,
      2
    )
  );
  const [aiPrefsText, setAiPrefsText] = useState(
    JSON.stringify(
      {
        enable_smart_scheduling: true,
        enable_no_show_detection: true,
        enable_inventory_anomaly_flags: true,
        enable_revenue_forecast: true,
      },
      null,
      2
    )
  );

  // Staff
  const [staff, setStaff] = useState<UserRow[]>([]);
  const [staffRole, setStaffRole] = useState("Doctor");
  const [staffName, setStaffName] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const [staffPhone, setStaffPhone] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [sendInvite, setSendInvite] = useState(true);
  const [creatingStaff, setCreatingStaff] = useState(false);

  const treatmentsList = useMemo(() => {
    const items = treatmentsText
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    return Array.from(new Set(items));
  }, [treatmentsText]);

  async function loadClinic() {
    setLoading(true);
    setToast(null);
    try {
      const res = await fetch(api("/api/admin/clinic-setup"), {
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        let msg = `Failed to load clinic setup (${res.status})`;
        try {
          const data = await readJsonOrThrow(res);
          msg = data?.error || data?.message || msg;
        } catch {
          // ignore JSON parse, keep msg
        }
        throw new Error(msg);
      }

      const data = await readJsonOrThrow(res);
      const c: ClinicSettings = data?.clinic || {
        clinic_name: "",
        address: "",
        phone: "",
        email: "",
        timezone: "Asia/Kolkata",
        working_hours: DEFAULT_WORKING_HOURS,
        treatment_types: [],
        note_templates: {},
        ai_prefs: {},
      };

      setClinicName(c.clinic_name || "");
      setAddress(c.address || "");
      setPhone(c.phone || "");
      setEmail(c.email || "");
      setTimezone(c.timezone || "Asia/Kolkata");

      setWorkingHoursText(
        JSON.stringify(safeJsonParse(c.working_hours, DEFAULT_WORKING_HOURS), null, 2)
      );
      setNoteTemplatesText(
        JSON.stringify(
          safeJsonParse(c.note_templates, {
            follow_up: "Follow-up reminder: Please visit the clinic in {{days}} days.",
          }),
          null,
          2
        )
      );
      setAiPrefsText(
        JSON.stringify(
          safeJsonParse(c.ai_prefs, { enable_smart_scheduling: true }),
          null,
          2
        )
      );

      const tts = Array.isArray(c.treatment_types) ? c.treatment_types : [];
      setTreatmentsText(tts.join("\n"));
    } catch (e: any) {
      setToast(e?.message || "Failed to load clinic setup");
    } finally {
      setLoading(false);
    }
  }

  async function loadStaff() {
    try {
      const roles = ["Doctor", "Assistant", "Admin"];
      const results = await Promise.all(
        roles.map((r) =>
          fetch(api(`/api/admin/users?role=${encodeURIComponent(r)}`), {
            headers: getAuthHeaders(),
          })
        )
      );

      const payloads = await Promise.all(
        results.map(async (res) => {
          if (!res.ok) return { users: [] as UserRow[] };
          try {
            return await readJsonOrThrow(res);
          } catch {
            return { users: [] as UserRow[] };
          }
        })
      );

      const all = ([] as UserRow[])
        .concat(payloads[2]?.users || []) // Admin
        .concat(payloads[0]?.users || []) // Doctor
        .concat(payloads[1]?.users || []) // Assistant
        .filter((u) => u && u.id);

      all.sort((a, b) => {
        const ra = (a.role || "").localeCompare(b.role || "");
        if (ra !== 0) return ra;
        return (a.full_name || "").localeCompare(b.full_name || "");
      });

      setStaff(all);
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    loadClinic().finally(loadStaff);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveClinic() {
    setSaving(true);
    setToast(null);
    try {
      const working_hours = JSON.parse(workingHoursText);
      const note_templates = JSON.parse(noteTemplatesText);
      const ai_prefs = JSON.parse(aiPrefsText);

      const payload = {
        clinic_name: clinicName,
        address,
        phone,
        email,
        timezone,
        working_hours,
        treatment_types: treatmentsList,
        note_templates,
        ai_prefs,
      };

      const res = await fetch(api("/api/admin/clinic-setup"), {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await readJsonOrThrow(res);
      if (!res.ok) throw new Error(data?.error || data?.message || `Save failed (${res.status})`);

      setToast("Saved successfully.");
    } catch (e: any) {
      setToast(e?.message || "Save failed");
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 3500);
    }
  }

  async function createStaff() {
    setCreatingStaff(true);
    setToast(null);
    try {
      if (!staffName.trim()) throw new Error("Full name is required");
      if (!staffEmail.trim()) throw new Error("Email is required for staff accounts");

      // map UI roles -> backend-friendly (keeps your existing UI labels)
      const role =
        staffRole.toLowerCase() === "doctor"
          ? "DOCTOR"
          : staffRole.toLowerCase() === "admin"
          ? "ADMIN"
          : "ASSISTANT";

      const payload = {
        role,
        full_name: staffName.trim(),
        email: staffEmail.trim(),
        phone: staffPhone.trim() ? staffPhone.trim() : null,
        password: staffPassword.trim() ? staffPassword.trim() : null,
        send_invite: !!sendInvite,
      };

      const res = await fetch(api("/api/admin/users"), {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await readJsonOrThrow(res);
      if (!res.ok) throw new Error(data?.error || data?.message || `Create failed (${res.status})`);

      setStaffName("");
      setStaffEmail("");
      setStaffPhone("");
      setStaffPassword("");
      setToast("Staff account created.");
      await loadStaff();
    } catch (e: any) {
      setToast(e?.message || "Failed to create staff");
    } finally {
      setCreatingStaff(false);
      setTimeout(() => setToast(null), 4000);
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clinic Setup</h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure clinic details, working hours, templates, and create staff accounts.
          </p>
        </div>
        <button
          onClick={saveClinic}
          disabled={saving || loading}
          className={`px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition ${
            saving || loading
              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>

      {toast && (
        <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 text-blue-800 px-4 py-3 text-sm">
          {toast}
        </div>
      )}

      {loading ? (
        <div className="mt-8 text-sm text-gray-500">Loading clinic settings…</div>
      ) : (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Clinic Info */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold">Clinic Information</h2>
            <div className="mt-4 grid grid-cols-1 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-600">Clinic Name</label>
                <input
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="e.g., SmileCare Dental Clinic"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Address</label>
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="Full clinic address"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-600">Phone</label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder="Clinic phone"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Email</label>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder="Clinic email"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Timezone</label>
                <input
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="Asia/Kolkata"
                />
              </div>
            </div>
          </div>

          {/* Staff */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold">Staff Accounts</h2>
            <p className="text-xs text-gray-500 mt-1">
              Admin should create Doctor/Assistant accounts here. Staff should not self-register.
            </p>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-600">Role</label>
                <select
                  value={staffRole}
                  onChange={(e) => setStaffRole(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="Doctor">Doctor</option>
                  <option value="Assistant">Assistant</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Full Name</label>
                <input
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="e.g., Dr. Asha Kumar"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Email</label>
                <input
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="Staff login email"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Phone</label>
                <input
                  value={staffPhone}
                  onChange={(e) => setStaffPhone(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="Optional"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-medium text-gray-600">
                  Temporary Password (optional)
                </label>
                <input
                  value={staffPassword}
                  onChange={(e) => setStaffPassword(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="Leave empty to auto-generate"
                />
              </div>
              <div className="md:col-span-2 flex items-center gap-2">
                <input
                  id="sendInvite"
                  type="checkbox"
                  checked={sendInvite}
                  onChange={(e) => setSendInvite(e.target.checked)}
                />
                <label htmlFor="sendInvite" className="text-sm text-gray-600">
                  Email an invite with the login password
                </label>
              </div>

              <div className="md:col-span-2">
                <button
                  onClick={createStaff}
                  disabled={creatingStaff}
                  className={`w-full px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition ${
                    creatingStaff
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                      : "bg-gray-900 text-white hover:bg-black"
                  }`}
                >
                  {creatingStaff ? "Creating…" : "Create Staff Account"}
                </button>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Existing Staff</h3>
                <button onClick={loadStaff} className="text-xs text-blue-700 hover:text-blue-800">
                  Refresh
                </button>
              </div>
              <div className="mt-3 overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium">Role</th>
                      <th className="px-4 py-2 text-left font-medium">Name</th>
                      <th className="px-4 py-2 text-left font-medium">Email</th>
                      <th className="px-4 py-2 text-left font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staff.length === 0 ? (
                      <tr>
                        <td className="px-4 py-3 text-gray-500" colSpan={4}>
                          No staff added yet.
                        </td>
                      </tr>
                    ) : (
                      staff.map((u) => (
                        <tr key={u.id} className="border-t border-gray-100">
                          <td className="px-4 py-2">{u.role}</td>
                          <td className="px-4 py-2">{u.full_name}</td>
                          <td className="px-4 py-2 text-gray-600">{u.email || "—"}</td>
                          <td className="px-4 py-2">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                u.is_active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {u.is_active ? "Active" : "Disabled"}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Treatments */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold">Treatment Types</h2>
            <p className="text-xs text-gray-500 mt-1">
              One per line (used in cases, procedures, and duration predictions).
            </p>
            <textarea
              value={treatmentsText}
              onChange={(e) => setTreatmentsText(e.target.value)}
              rows={10}
              className="mt-4 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="CONSULTATION\nCHECKUP\nSCALING\nFILLING\nROOT_CANAL\nIMPLANT"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {treatmentsList.slice(0, 18).map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
                >
                  {t}
                </span>
              ))}
              {treatmentsList.length > 18 && (
                <span className="text-xs text-gray-500">+{treatmentsList.length - 18} more…</span>
              )}
            </div>
          </div>

          {/* JSON Blocks */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold">Automation Preferences</h2>
            <p className="text-xs text-gray-500 mt-1">
              Keep these as valid JSON. (Smart scheduling, reminders, anomaly flags, forecasts)
            </p>

            <div className="mt-4 grid grid-cols-1 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-600">Working Hours JSON</label>
                <textarea
                  value={workingHoursText}
                  onChange={(e) => setWorkingHoursText(e.target.value)}
                  rows={8}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Note Templates JSON</label>
                <textarea
                  value={noteTemplatesText}
                  onChange={(e) => setNoteTemplatesText(e.target.value)}
                  rows={6}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">AI Preferences JSON</label>
                <textarea
                  value={aiPrefsText}
                  onChange={(e) => setAiPrefsText(e.target.value)}
                  rows={6}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ✅ supports BOTH import styles:
// import AdminClinicSetup from "..."
// import { AdminClinicSetup } from "..."
export default AdminClinicSetup;
