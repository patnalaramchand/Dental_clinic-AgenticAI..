// src/layouts/doctor/DoctorLayout.tsx
import React, { useState, useEffect } from "react";
import { MenuIcon } from "lucide-react";
import { DoctorSidebar } from "./DoctorSidebar";

interface DoctorLayoutProps {
  children: React.ReactNode;
}

const SIDEBAR_KEY = "doctor_sidebar_open";

export const DoctorLayout: React.FC<DoctorLayoutProps> = ({ children }) => {
  // ✅ DEFAULT: CLOSED
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(SIDEBAR_KEY) === "true";
  });

  // ✅ Persist state (no auto-open ever)
  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, String(sidebarOpen));
  }, [sidebarOpen]);

  const openSidebar = () => setSidebarOpen(true);
  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  return (
    <div className="h-screen flex overflow-hidden bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-50 transition-colors duration-150">
      
      {/* Sidebar never scrolls */}
      <DoctorSidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Mobile top bar */}
        <header className="flex items-center justify-between px-3 py-2 lg:hidden border-b border-neutral-200 dark:border-neutral-800 bg-white/90 dark:bg-neutral-900/95 backdrop-blur">
          <div className="text-sm font-semibold">
            Doctor workspace
          </div>

          {/* ❗ ONLY user action opens sidebar */}
          <button
            type="button"
            onClick={openSidebar}
            className="inline-flex items-center justify-center h-9 w-9 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-200"
            aria-label="Open menu"
          >
            <MenuIcon size={18} />
          </button>
        </header>

        {/* Only content scrolls */}
        <main className="flex-1 overflow-y-auto px-4 lg:px-6 py-5">
          {children}
        </main>
      </div>
    </div>
  );
};
