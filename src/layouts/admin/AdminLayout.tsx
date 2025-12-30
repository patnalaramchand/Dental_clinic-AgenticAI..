// src/layouts/admin/AdminLayout.tsx
import React, { useState } from "react";
import { Menu as MenuIcon } from "lucide-react";
import { AdminSidebar } from "./AdminSidebar";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const SIDEBAR_KEY = "admin_sidebar_open";

const isDesktop = () =>
  typeof window !== "undefined" && window.innerWidth >= 1024;

const getInitialSidebarState = (): boolean => {
  if (typeof window === "undefined") return false;

  const stored = localStorage.getItem(SIDEBAR_KEY);
  if (stored === "true") return true;
  if (stored === "false") return false;

  // First-time default: open only on desktop
  return isDesktop();
};

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(
    getInitialSidebarState
  );

  const setOpen = (value: boolean) => {
    setSidebarOpen(value);
    localStorage.setItem(SIDEBAR_KEY, String(value));
  };

  const openSidebar = () => setOpen(true);
  const closeSidebar = () => setOpen(false);
  const toggleSidebar = () => setOpen(!sidebarOpen);

  return (
    <div className="h-screen flex overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50">
      {/* Sidebar */}
      <AdminSidebar
        isOpen={sidebarOpen}
        onToggle={toggleSidebar}
        onClose={closeSidebar}
      />

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-4 lg:px-6 py-3 border-b border-slate-200/80 dark:border-slate-900/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur">
          <div className="flex items-center gap-2">
            {!sidebarOpen && (
              <button
                type="button"
                onClick={openSidebar}
                className="inline-flex lg:hidden items-center justify-center h-9 w-9 rounded-xl border border-slate-200/80 dark:border-slate-800/80"
                aria-label="Open sidebar"
              >
                <MenuIcon size={18} />
              </button>
            )}

            <div className="hidden lg:block text-xs font-semibold tracking-[0.18em] uppercase text-slate-500 dark:text-slate-400">
              Admin Panel
            </div>
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            Dental Clinic • Admin
          </div>
        </header>

        {/* ✅ THIS WAS MISSING — PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto px-4 lg:px-6 py-5">
          {children}
        </main>
      </div>
    </div>
  );
};
