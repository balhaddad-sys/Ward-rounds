'use client';

import { usePathname, useRouter } from 'next/navigation';

/**
 * Mobile-optimized layout with bottom navigation
 * Includes safe area support for notched devices
 */
export function MobileLayout({ children, hideNav = false }) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { id: '/', icon: '🏠', label: 'Home' },
    { id: '/scan', icon: '📷', label: 'Scan' },
    { id: '/patients', icon: '👥', label: 'Patients' },
    { id: '/learn', icon: '📚', label: 'Learn' },
    { id: '/settings', icon: '⚙️', label: 'Settings' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      {/* Status bar safe area */}
      <div className="h-safe-top bg-primary" />

      {/* Main content */}
      <main className={`flex-1 overflow-auto ${hideNav ? '' : 'pb-20'}`}>
        {children}
      </main>

      {/* Bottom navigation */}
      {!hideNav && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 safe-bottom shadow-lg">
          <div className="flex justify-around items-center h-16 px-2">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => router.push(item.id)}
                className={`flex flex-col items-center justify-center min-w-touch min-h-touch p-2 rounded-lg transition-all ${
                  pathname === item.id
                    ? 'text-primary bg-blue-50 dark:bg-blue-900/30 scale-105'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
                aria-label={item.label}
              >
                <span className="text-2xl mb-0.5">{item.icon}</span>
                <span className="text-[10px] font-medium leading-none">{item.label}</span>
              </button>
            ))}
          </div>
        </nav>
      )}

      {/* Bottom safe area */}
      <div className="h-safe-bottom bg-white dark:bg-slate-800" />
    </div>
  );
}

export default MobileLayout;
