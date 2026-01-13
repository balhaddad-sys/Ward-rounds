'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    patients: 0,
    reports: 0,
    presentations: 0,
    pearls: 0
  });
  const router = useRouter();

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('medward_token');
    const userData = localStorage.getItem('medward_user');

    if (!token || !userData) {
      window.location.href = '/Ward-rounds/login/';
      return;
    }

    setUser(JSON.parse(userData));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('medward_token');
    localStorage.removeItem('medward_user');
    window.location.href = '/Ward-rounds/login/';
  };

  const handleScanReport = () => {
    window.location.href = '/Ward-rounds/scanner/';
  };

  const handleNewPatient = () => {
    window.location.href = '/Ward-rounds/patients/';
  };

  const handleStudyPearls = () => {
    alert('🎓 Study Pearls feature coming soon!\n\nYou\'ll be able to:\n• Review clinical pearls\n• Access teaching points\n• Study medical concepts');
  };

  const handleViewReports = () => {
    window.location.href = '/Ward-rounds/reports/';
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <span className="text-gray-600 font-medium">Loading your dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-2xl">🏥</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">MedWard</h1>
                <p className="text-sm text-gray-500">Welcome back, {user.username}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Banner */}
        <div className="mb-8 bg-gradient-to-r from-primary via-blue-600 to-indigo-600 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
            <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-white rounded-full blur-3xl"></div>
          </div>
          <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-2">Good to see you! 👋</h2>
            <p className="text-blue-100 text-lg">Ready to review your ward presentations and learn something new?</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                <span className="text-2xl">👥</span>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats.patients}</div>
            <div className="text-sm text-gray-500 font-medium">Active Patients</div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-md">
                <span className="text-2xl">📄</span>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats.reports}</div>
            <div className="text-sm text-gray-500 font-medium">Reports Analyzed</div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                <span className="text-2xl">📋</span>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats.presentations}</div>
            <div className="text-sm text-gray-500 font-medium">Presentations</div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-md">
                <span className="text-2xl">💎</span>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats.pearls}</div>
            <div className="text-sm text-gray-500 font-medium">Clinical Pearls</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <button onClick={handleScanReport} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border border-gray-100 text-left group">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform">
                  <span className="text-3xl">📷</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2 text-lg">Scan New Report</h4>
                <p className="text-sm text-gray-500">Upload lab results or imaging reports for AI analysis</p>
              </button>

              <button onClick={handleNewPatient} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border border-gray-100 text-left group">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform">
                  <span className="text-3xl">➕</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2 text-lg">New Patient</h4>
                <p className="text-sm text-gray-500">Add a new patient to your ward list</p>
              </button>

              <button onClick={handleStudyPearls} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border border-gray-100 text-left group">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform">
                  <span className="text-3xl">🎓</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2 text-lg">Study Pearls</h4>
                <p className="text-sm text-gray-500">Review clinical pearls and teaching points</p>
              </button>

              <button onClick={handleViewReports} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border border-gray-100 text-left group">
                <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform">
                  <span className="text-3xl">📊</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2 text-lg">View Reports</h4>
                <p className="text-sm text-gray-500">Browse all analyzed medical reports</p>
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h3>
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">📄</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">Report Analyzed</p>
                    <p className="text-xs text-gray-500 truncate">CBC results for Patient #1234</p>
                    <p className="text-xs text-gray-400 mt-1">2 hours ago</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">✅</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">Presentation Created</p>
                    <p className="text-xs text-gray-500 truncate">Ward round for Patient #5678</p>
                    <p className="text-xs text-gray-400 mt-1">5 hours ago</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">💎</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">New Pearl</p>
                    <p className="text-xs text-gray-500 truncate">Learned about troponin levels</p>
                    <p className="text-xs text-gray-400 mt-1">1 day ago</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">👥</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">Patient Added</p>
                    <p className="text-xs text-gray-500 truncate">New admission to ward</p>
                    <p className="text-xs text-gray-400 mt-1">2 days ago</p>
                  </div>
                </div>
              </div>

              <button className="w-full mt-6 py-2 text-sm font-medium text-primary hover:bg-blue-50 rounded-lg transition-colors">
                View All Activity
              </button>
            </div>
          </div>
        </div>

        {/* Tips Section */}
        <div className="mt-8 bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">💡</span>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-1">Pro Tip</h4>
              <p className="text-white/90">You can upload multiple reports at once for batch analysis. Just drag and drop all files into the scanner!</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
