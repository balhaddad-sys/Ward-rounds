'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, today, week, month
  const router = useRouter();

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      // Read reports from localStorage
      const savedReports = JSON.parse(localStorage.getItem('medward_reports') || '[]');
      setReports(savedReports);
    } catch (error) {
      console.error('Error fetching reports:', error);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReportClick = (report) => {
    // Navigate to report detail page (to be implemented)
    console.log('Selected report:', report);
    alert(`Report details for "${report.title}" coming soon!`);
  };

  const getReportIcon = (type) => {
    switch (type) {
      case 'Lab':
        return '🧪';
      case 'Imaging':
        return '🩻';
      default:
        return '📄';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'analyzed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => window.location.href = '/Ward-rounds/dashboard/'}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                ← Back
              </button>
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-2xl">📊</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Reports</h1>
                <p className="text-sm text-gray-500">{reports.length} total reports</p>
              </div>
            </div>
            <button
              onClick={() => window.location.href = '/Ward-rounds/scanner/'}
              className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors shadow-md"
            >
              📷 Upload Report
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="mb-6 flex gap-2 overflow-x-auto">
          {['all', 'today', 'week', 'month'].map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                filter === filterOption
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
              <span className="text-gray-600 font-medium">Loading reports...</span>
            </div>
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-lg">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">📊</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Reports Yet</h3>
            <p className="text-gray-600 mb-6">Upload your first medical report to get started</p>
            <button
              onClick={() => window.location.href = '/Ward-rounds/scanner/'}
              className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors shadow-md"
            >
              📷 Upload Report
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="divide-y divide-gray-100">
              {reports.map((report) => (
                <button
                  key={report.id}
                  onClick={() => handleReportClick(report)}
                  className="w-full p-6 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl">{getReportIcon(report.type)}</span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 mb-1">{report.title}</h3>
                          <p className="text-sm text-gray-600">
                            {report.patientName} • {report.patientMrn}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(
                            report.status
                          )}`}
                        >
                          {report.status === 'analyzed' ? '✓ Analyzed' : '⏳ Pending'}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <span>📁</span>
                          {report.fileType}
                        </span>
                        <span className="flex items-center gap-1">
                          <span>🏷️</span>
                          {report.type}
                        </span>
                        <span className="flex items-center gap-1">
                          <span>🕐</span>
                          {formatDate(report.date)}
                        </span>
                      </div>
                    </div>

                    {/* Arrow */}
                    <span className="text-gray-400 text-xl self-center">→</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {reports.filter((r) => r.status === 'analyzed').length}
            </div>
            <div className="text-sm text-gray-500">Analyzed</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {reports.filter((r) => r.status === 'pending').length}
            </div>
            <div className="text-sm text-gray-500">Pending</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
            <div className="text-2xl font-bold text-gray-900 mb-1">{reports.length}</div>
            <div className="text-sm text-gray-500">Total</div>
          </div>
        </div>
      </main>
    </div>
  );
}
