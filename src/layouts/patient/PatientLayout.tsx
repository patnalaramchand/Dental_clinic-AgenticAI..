// src/layouts/patient/PatientLayout.tsx
import React, { useState } from 'react';
import { MenuIcon } from 'lucide-react';
import { PatientSidebar } from './PatientSidebar';

interface PatientLayoutProps {
  children: React.ReactNode;
}

export const PatientLayout: React.FC<PatientLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  return (
    <div className="flex min-h-screen bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-50 transition-colors duration-150">
      <PatientSidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar (ChatGPT-like) */}
        <header className="flex items-center justify-between px-3 py-2 lg:hidden border-b border-neutral-200 dark:border-neutral-800 bg-white/90 dark:bg-neutral-900/95 backdrop-blur">
          <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
            Patient portal
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="inline-flex items-center justify-center h-9 w-9 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-200"
            aria-label="Open menu"
          >
            <MenuIcon size={18} />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto px-4 lg:px-6 py-5">
          {children}
        </main>
      </div>
    </div>
  );
};
