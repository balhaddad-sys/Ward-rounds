'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DocumentScanner } from '@/components/scanner/DocumentScanner';

export default function ScannerPage() {
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const router = useRouter();

  const handleCapture = async (file, method) => {
    setUploading(true);
    setUploadSuccess(false);

    try {
      // Since this is a static export, store report info in localStorage
      // Get existing reports
      const existingReports = JSON.parse(localStorage.getItem('medward_reports') || '[]');

      // Create new report entry
      const newReport = {
        id: Date.now(),
        type: file.type.includes('pdf') ? 'Lab' : 'Imaging',
        title: file.name,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        uploadMethod: method,
        date: new Date().toISOString(),
        status: 'pending',
        patientName: 'New Patient', // Default - user can assign later
        patientMrn: 'TBD'
      };

      // Add to reports array
      existingReports.unshift(newReport);

      // Save back to localStorage
      localStorage.setItem('medward_reports', JSON.stringify(existingReports));

      console.log('Report saved locally:', newReport);

      setUploadSuccess(true);

      // Redirect to reports page after 2 seconds
      setTimeout(() => {
        window.location.href = '/Ward-rounds/reports/';
      }, 2000);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to save report. Please try again.');
    } finally {
      setUploading(false);
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
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-2xl">📷</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Scan Report</h1>
                <p className="text-sm text-gray-500">Upload medical documents for analysis</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {uploading ? (
            <div className="flex flex-col items-center justify-center p-12">
              <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600 font-medium">Uploading report...</p>
            </div>
          ) : uploadSuccess ? (
            <div className="flex flex-col items-center justify-center p-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-4xl">✅</span>
              </div>
              <p className="text-gray-900 font-bold text-xl mb-2">Upload Successful!</p>
              <p className="text-gray-600">Redirecting to reports...</p>
            </div>
          ) : (
            <DocumentScanner onCapture={handleCapture} />
          )}
        </div>

        {/* Tips */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex gap-3">
            <span className="text-xl">💡</span>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Supported Formats</h4>
              <p className="text-sm text-gray-600">
                You can upload lab results, imaging reports, discharge summaries, and other medical documents.
                Supported formats: JPG, PNG, PDF (up to 10MB)
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
