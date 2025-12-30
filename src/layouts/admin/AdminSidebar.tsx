// src/layouts/admin/AdminSidebar.tsx
import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboardIcon,
  CalendarDaysIcon,
  UsersIcon,
  ClipboardListIcon,
  PackageIcon,
  LineChartIcon,
  HelpCircleIcon,
  LogOutIcon,
  PanelLeftIcon,
  SunIcon,
  MoonIcon,
  UserIcon,
  ActivityIcon,
  BellIcon,
  SettingsIcon,
} from "lucide-react";
import { clearAuth } from "../../components/ProtectedRoute";

interface AdminSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

type ThemeMode = "light" | "dark";
const THEME_KEY = "theme";

const getInitialTheme = (): ThemeMode => {
  if (typeof window === "undefined") return "dark";
  const saved = localStorage.getItem(THEME_KEY) as ThemeMode | null;
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

const applyTheme = (mode: ThemeMode) => {
  const root = document.documentElement;
  mode === "dark" ? root.classList.add("dark") : root.classList.remove("dark");
};

const navBase =
  "flex items-center rounded-xl py-2 text-sm font-medium transition-colors";
const active =
  "bg-slate-900 text-slate-50 dark:bg-slate-100 dark:text-slate-950 shadow-sm";
const inactive =
  "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-50 hover:bg-slate-100/60 dark:hover:bg-slate-800/60";

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  isOpen,
  onToggle,
  onClose,
}) => {
  const navigate = useNavigate();
  const userName = localStorage.getItem("userName") || "Admin";

  const [themeMode, setThemeMode] = useState<ThemeMode>(getInitialTheme);

  useEffect(() => {
    applyTheme(themeMode);
    localStorage.setItem(THEME_KEY, themeMode);
  }, [themeMode]);

  const handleLogout = () => {
    clearAuth();
    navigate("/login", { replace: true });
  };

  // 🔑 CRITICAL: nav click NEVER opens sidebar
  const handleNavClick = () => {
    if (!isOpen) return;
    if (window.innerWidth < 1024) onClose();
  };

  const navItems = [
    { to: "/admin/dashboard", label: "Dashboard", Icon: LayoutDashboardIcon },
    { to: "/admin/clinic-setup", label: "Clinic setup", Icon: SettingsIcon },
    { to: "/admin/appointments", label: "Appointments", Icon: CalendarDaysIcon },
    { to: "/admin/patients", label: "Patients", Icon: UsersIcon },
    { to: "/admin/cases", label: "Cases", Icon: ClipboardListIcon },
    { to: "/admin/case-tracking", label: "Case tracking", Icon: ActivityIcon },

    // ✅ NEW
    { to: "/admin/notifications", label: "Notifications", Icon: BellIcon },

    { to: "/admin/inventory", label: "Inventory", Icon: PackageIcon },
    { to: "/admin/revenue", label: "Revenue", Icon: LineChartIcon },
    { to: "/admin/help", label: "Help & contact", Icon: HelpCircleIcon },
  ];

  const SidebarBody = () => (
    <div className="flex h-full flex-col bg-slate-950 text-slate-50 border-r border-slate-800">
      {/* Header */}
      <div
        className={`flex items-center border-b border-slate-800 ${
          isOpen ? "justify-between px-3 py-3" : "justify-center px-1 py-3"
        }`}
      >
        {isOpen && (
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl bg-slate-900 border border-slate-700 grid place-items-center font-semibold">
              DC
            </div>
            <div className="text-sm font-semibold">Dental Clinic Admin</div>
          </div>
        )}

        <button
          type="button"
          onClick={onToggle}
          className="h-8 w-8 grid place-items-center rounded-full hover:bg-slate-800 text-slate-400"
        >
          <PanelLeftIcon
            size={18}
            className={isOpen ? "rotate-180 transition-transform" : ""}
          />
        </button>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
        {navItems.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={handleNavClick}
            className={({ isActive }) =>
              [
                navBase,
                isOpen ? "px-3 gap-2.5" : "justify-center",
                isActive ? active : inactive,
              ].join(" ")
            }
          >
            <Icon size={18} />
            {isOpen && <span>{label}</span>}
          </NavLink>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-800 px-3 py-3 space-y-3">
        {isOpen && (
          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 px-2 py-1.5">
            <span className="text-[11px] text-slate-400">Appearance</span>
            <div className="flex gap-1">
              <button
                onClick={() => setThemeMode("light")}
                className={`h-7 w-7 rounded-lg grid place-items-center ${
                  themeMode === "light"
                    ? "bg-slate-100 text-slate-900"
                    : "hover:bg-slate-800"
                }`}
              >
                <SunIcon size={14} />
              </button>
              <button
                onClick={() => setThemeMode("dark")}
                className={`h-7 w-7 rounded-lg grid place-items-center ${
                  themeMode === "dark"
                    ? "bg-slate-800 text-slate-50"
                    : "hover:bg-slate-800"
                }`}
              >
                <MoonIcon size={14} />
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-slate-800 grid place-items-center">
              <UserIcon size={14} />
            </div>
            {isOpen && (
              <div>
                <p className="text-xs font-medium">{userName}</p>
                <p className="text-[11px] text-slate-500">Signed in</p>
              </div>
            )}
          </div>

          {isOpen && (
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 px-2.5 py-1 text-[11px] hover:bg-slate-800"
            >
              <LogOutIcon size={13} />
              Logout
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside
        className={`hidden lg:block h-screen transition-[width] duration-150 ${
          isOpen ? "w-64" : "w-16"
        }`}
      >
        <SidebarBody />
      </aside>

      {/* Mobile */}
      <div
        className={`fixed inset-0 z-40 lg:hidden ${
          isOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        <div
          className={`absolute inset-0 bg-black/40 ${
            isOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={onClose}
        />
        <aside
          className={`absolute inset-y-0 left-0 w-64 bg-slate-950 transform transition-transform ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <SidebarBody />
        </aside>
      </div>
    </>
  );
};
