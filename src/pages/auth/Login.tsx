import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, NavigateFunction } from "react-router-dom";
import {
  Mail as MailIcon,
  ArrowLeft as ArrowLeftIcon,
  Lock as LockIcon,
  User as UserIcon,
  Sun as SunIcon,
  Moon as MoonIcon,
} from "lucide-react";

type Role = "ADMIN" | "DOCTOR" | "PATIENT";

const roleLabel: Record<Role, string> = {
  ADMIN: "Admin",
  DOCTOR: "Doctor",
  PATIENT: "Patient",
};

type ThemeMode = "light" | "dark" | "system";
const THEME_KEY = "theme";

// ✅ Use env base URL (fallback stays localhost)
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
const LOGIN_URL = `${API_BASE}/api/auth/login`;

// ---------- THEME HELPERS ----------
function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  const shouldBeDark = mode === "dark" || (mode === "system" && prefersDark);
  root.classList.toggle("dark", !!shouldBeDark);
}

// ---------- AUTH HELPERS ----------
function normalizeRoleString(value: unknown): Role | null {
  if (!value) return null;
  const upper = String(value).toUpperCase();
  if (upper === "ADMIN" || upper === "DOCTOR" || upper === "PATIENT") return upper as Role;
  return null;
}

function roleToUserType(role: Role): "Admin" | "Doctor" | "Patient" {
  if (role === "ADMIN") return "Admin";
  if (role === "DOCTOR") return "Doctor";
  return "Patient";
}

function redirectAfterAuth(role: Role, navigate: NavigateFunction) {
  if (role === "ADMIN") navigate("/app/AdminDashboard", { replace: true });
  else if (role === "DOCTOR") navigate("/app/DoctorDashboard", { replace: true });
  else navigate("/app/PatientDashboard", { replace: true });
}

export const Login: React.FC = () => {
  const [role, setRole] = useState<Role>("DOCTOR");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [themeMode, setThemeMode] = useState<ThemeMode>("system");

  // If already authenticated, block access to /login
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const storedRole = normalizeRoleString(localStorage.getItem("userRole"));
    if (token && storedRole) redirectAfterAuth(storedRole, navigate);
  }, [navigate]);

  // theme boot
  useEffect(() => {
    const cached = (localStorage.getItem(THEME_KEY) as ThemeMode | null) ?? "system";
    const initial: ThemeMode =
      cached === "light" || cached === "dark" || cached === "system" ? cached : "system";

    setThemeMode(initial);
    applyTheme(initial);

    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    const onSystemChange = () => {
      const current = (localStorage.getItem(THEME_KEY) as ThemeMode | null) ?? initial;
      if (current === "system") applyTheme("system");
    };

    mq?.addEventListener?.("change", onSystemChange);
    return () => mq?.removeEventListener?.("change", onSystemChange);
  }, []);

  const setTheme = (mode: ThemeMode) => {
    setThemeMode(mode);
    localStorage.setItem(THEME_KEY, mode);
    applyTheme(mode);
  };

  const cycleTheme = () => {
    const next: ThemeMode = themeMode === "light" ? "dark" : themeMode === "dark" ? "system" : "light";
    setTheme(next);
  };

  const roleAccent = useMemo(() => {
    switch (role) {
      case "ADMIN":
        return {
          ring: "focus:ring-violet-500/20 focus:border-violet-500/60",
          tabActive: "bg-violet-600 text-white shadow-sm",
          glow: "from-violet-500/25 via-fuchsia-500/15 to-sky-500/20",
          icon: "text-violet-600 dark:text-violet-300",
          button: "bg-violet-600 hover:bg-violet-700",
        };
      case "PATIENT":
        return {
          ring: "focus:ring-sky-500/20 focus:border-sky-500/60",
          tabActive: "bg-sky-600 text-white shadow-sm",
          glow: "from-sky-500/25 via-emerald-500/15 to-indigo-500/20",
          icon: "text-sky-600 dark:text-sky-300",
          button: "bg-sky-600 hover:bg-sky-700",
        };
      default:
        return {
          ring: "focus:ring-emerald-500/20 focus:border-emerald-500/60",
          tabActive: "bg-emerald-600 text-white shadow-sm",
          glow: "from-emerald-500/25 via-teal-500/15 to-sky-500/20",
          icon: "text-emerald-600 dark:text-emerald-300",
          button: "bg-emerald-600 hover:bg-emerald-700",
        };
    }
  }, [role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(LOGIN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // ✅ send both formats so backend never mismatches
        body: JSON.stringify({
          email: email.trim(),
          password,
          role, // "ADMIN" | "DOCTOR" | "PATIENT"
          userType: roleToUserType(role), // "Admin" | "Doctor" | "Patient"
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Login failed. Please check your credentials.");
        return;
      }

      const normalizedRole = normalizeRoleString(data.role) ?? role;

      localStorage.setItem("authToken", data.token);
      localStorage.setItem("userRole", normalizedRole);
      localStorage.setItem("userId", data.uid || "");
      localStorage.setItem("userName", data.name || "");

      redirectAfterAuth(normalizedRole, navigate);
    } catch (err) {
      console.error(err);
      setError("Cannot reach server. Make sure Node backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50">
      <div className="pointer-events-none fixed inset-0">
        <div
          className={`absolute -top-28 left-1/2 -translate-x-1/2 h-[620px] w-[620px] rounded-full bg-gradient-to-br ${roleAccent.glow} blur-3xl opacity-60`}
        />
        <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_50%_0%,rgba(255,255,255,0.85),transparent)] dark:bg-[radial-gradient(1200px_600px_at_50%_0%,rgba(2,6,23,0.25),transparent)]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-10">
        <div className="flex items-center justify-between">
          {/* ✅ label fixed */}
          <Link
            to="/landing"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition"
          >
            <ArrowLeftIcon size={16} />
            Back
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTheme("light")}
              aria-label="Light"
              title="Light"
              className={[
                "h-10 w-10 rounded-2xl grid place-items-center backdrop-blur transition",
                "border border-slate-200/70 dark:border-slate-800/70",
                "bg-white/70 dark:bg-slate-950/50",
                "hover:bg-white/90 dark:hover:bg-slate-900/60",
                "active:scale-[0.98]",
                themeMode === "light" ? "ring-2 ring-slate-900/5 dark:ring-white/10" : "",
              ].join(" ")}
            >
              <SunIcon size={16} className="text-slate-700 dark:text-slate-200" />
            </button>

            <button
              type="button"
              onClick={() => setTheme("dark")}
              aria-label="Dark"
              title="Dark"
              className={[
                "h-10 w-10 rounded-2xl grid place-items-center backdrop-blur transition",
                "border border-slate-200/70 dark:border-slate-800/70",
                "bg-white/70 dark:bg-slate-950/50",
                "hover:bg-white/90 dark:hover:bg-slate-900/60",
                "active:scale-[0.98]",
                themeMode === "dark" ? "ring-2 ring-slate-900/5 dark:ring-white/10" : "",
              ].join(" ")}
            >
              <MoonIcon size={16} className="text-slate-700 dark:text-slate-200" />
            </button>

            <button
              type="button"
              onClick={cycleTheme}
              onContextMenu={(e) => {
                e.preventDefault();
                cycleTheme();
              }}
              aria-label="Theme"
              title="System / Cycle"
              className={[
                "h-10 w-10 rounded-2xl grid place-items-center backdrop-blur transition",
                "border border-slate-200/70 dark:border-slate-800/70",
                "bg-white/70 dark:bg-slate-950/50",
                "hover:bg-white/90 dark:hover:bg-slate-900/60",
                "active:scale-[0.98]",
                themeMode === "system" ? "ring-2 ring-slate-900/5 dark:ring-white/10" : "",
              ].join(" ")}
            >
              <span className="h-2 w-2 rounded-full bg-slate-900/35 dark:bg-white/35" />
            </button>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-[1.1fr,1fr] gap-10 items-center">
          <div className="hidden md:flex flex-col space-y-7">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                Welcome back to{" "}
                <span className="text-slate-900 dark:text-slate-50">Dental Clinic Intelligence</span>
              </h1>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed">
                Sign in with the correct role. Your workspace is tailored automatically with clean
                dashboards and AI insights.
              </p>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-1 rounded-[28px] bg-gradient-to-br from-white/60 to-white/10 dark:from-white/10 dark:to-white/5 blur-md" />
            <div className="relative rounded-[28px] border border-slate-200/70 dark:border-slate-800/70 bg-white/80 dark:bg-slate-950/60 backdrop-blur px-6 py-7 shadow-[0_26px_90px_-45px_rgba(15,23,42,0.45)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-white/70 dark:bg-slate-900/40 grid place-items-center font-bold text-slate-900 dark:text-slate-50">
                    DC
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">Login</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Access your workspace</p>
                  </div>
                </div>
                <UserIcon size={20} className={roleAccent.icon} />
              </div>

              <div className="mt-6">
                <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-slate-50/70 dark:bg-slate-900/35 p-1.5">
                  <div className="grid grid-cols-3 gap-1.5">
                    {(["ADMIN", "DOCTOR", "PATIENT"] as Role[]).map((r) => {
                      const active = role === r;
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setRole(r)}
                          className={[
                            "rounded-xl py-2.5 text-[12px] font-semibold transition",
                            active
                              ? roleAccent.tabActive
                              : "text-slate-600 dark:text-slate-300 hover:bg-white/70 dark:hover:bg-slate-950/40",
                          ].join(" ")}
                        >
                          {roleLabel[r]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {error && (
                <div className="mt-4 rounded-2xl border border-red-200/70 dark:border-red-500/30 bg-red-50/70 dark:bg-red-500/10 px-3 py-2 text-[12px] text-red-700 dark:text-red-100">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-200" htmlFor="email">
                    Email
                  </label>
                  <div className="mt-1.5 relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-slate-500">
                      <MailIcon size={16} />
                    </span>
                    <input
                      id="email"
                      type="email"
                      placeholder="you@clinic.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={[
                        "w-full rounded-2xl pl-9 pr-3 py-3 text-sm outline-none transition",
                        "border border-slate-200/70 dark:border-slate-800/70",
                        "bg-white/70 dark:bg-slate-950/40",
                        "placeholder:text-slate-400 dark:placeholder:text-slate-500",
                        "hover:border-slate-300/80 dark:hover:border-slate-700/80",
                        "focus:ring-4",
                        roleAccent.ring,
                      ].join(" ")}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-200" htmlFor="password">
                    Password
                  </label>
                  <div className="mt-1.5 relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-slate-500">
                      <LockIcon size={16} />
                    </span>
                    <input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={[
                        "w-full rounded-2xl pl-9 pr-3 py-3 text-sm outline-none transition",
                        "border border-slate-200/70 dark:border-slate-800/70",
                        "bg-white/70 dark:bg-slate-950/40",
                        "placeholder:text-slate-400 dark:placeholder:text-slate-500",
                        "hover:border-slate-300/80 dark:hover:border-slate-700/80",
                        "focus:ring-4",
                        roleAccent.ring,
                      ].join(" ")}
                    />
                  </div>

                  <div className="mt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => navigate("/forgot-password")}
                      className="text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 underline-offset-2 hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={[
                    "w-full rounded-2xl py-3.5 text-sm font-semibold text-white transition",
                    roleAccent.button,
                    "shadow-sm active:translate-y-[1px]",
                    "disabled:opacity-60 disabled:active:translate-y-0",
                  ].join(" ")}
                >
                  {loading ? "Signing in…" : `Login as ${roleLabel[role]}`}
                </button>
              </form>

              <div className="mt-5 pt-4 border-t border-slate-200/70 dark:border-slate-800/70 text-[12px] text-slate-600 dark:text-slate-300 flex justify-between items-center">
                <span>Don&apos;t have an account?</span>
                <Link to="/create-account" className="font-semibold text-slate-900 dark:text-slate-50 hover:opacity-80 transition">
                  Create one
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
